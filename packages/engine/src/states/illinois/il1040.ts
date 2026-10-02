import { earnedIncomeCredit, type EarnedIncomeCreditInput } from "../../credits/earnedIncomeCredit.ts";
import { ageAtEndOfYear } from "../../dates.ts";
import { isAge65OrOlder } from "../../deductions.ts";
import { percentOf, roundDollars, sumToDollars } from "../../money.ts";
import type { Diagnostic, Il1040Result, TaxReturnInput } from "../../types.ts";
import type { TaxYearParams } from "../../years/index.ts";
import { ILLINOIS_YEARS } from "./params.ts";

export interface Il1040Input {
  input: TaxReturnInput;
  federalParams: TaxYearParams;
  federalAgi: number;
  taxExemptInterest: number;
  /** Interest on US Treasury obligations included in federal AGI (1099-INT box 3). */
  usTreasuryInterest: number;
  /** The federal EITC computation inputs, reused for the Illinois EIC. */
  eitcInput: EarnedIncomeCreditInput;
}

/** Form IL-1040 for a full-year Illinois resident. */
export function il1040(args: Il1040Input, diagnostics: Diagnostic[]): Il1040Result | null {
  const { input, federalAgi } = args;
  const il = input.illinois;
  if (!il) return null;
  const p = ILLINOIS_YEARS[input.taxYear];
  if (!p) {
    diagnostics.push({
      severity: "unsupported",
      code: "il.year",
      message: `The Illinois return is not supported for ${input.taxYear}.`,
    });
    return null;
  }

  if (il.residency !== "fullYear") {
    diagnostics.push({
      severity: "unsupported",
      code: "il.residency",
      message: "Part-year and nonresident Illinois returns (Schedule NR) are not supported yet.",
    });
  }
  if (il.collegeSavingsContributions > 0) {
    diagnostics.push({
      severity: "warning",
      code: "il.collegeSavings",
      message:
        "The Illinois subtraction for Bright Start, Bright Directions, and ABLE contributions isn't supported yet, so your Illinois tax may be overstated.",
    });
  }
  if (args.taxExemptInterest > 0) {
    diagnostics.push({
      severity: "warning",
      code: "il.taxExemptInterest",
      message:
        "All federally tax-exempt interest is added to Illinois income. Interest from Illinois bonds is exempt in Illinois, so if you have any, your Illinois tax may be overstated.",
    });
  }
  const otherStateW2s = input.w2s.filter((w) => w.stateCode && w.stateCode.toUpperCase() !== "IL");
  if (otherStateW2s.length > 0) {
    diagnostics.push({
      severity: "unsupported",
      code: "il.otherStates",
      message:
        "You have wages from another state. Other state returns and the Illinois credit for tax paid to other states (Schedule CR) aren't supported yet.",
    });
  }

  if (input.w2s.some((w) => !w.stateCode && w.stateIncomeTaxWithheld > 0)) {
    diagnostics.push({
      severity: "warning",
      code: "il.w2StateCode",
      message: "A W-2 has state tax withheld but no state code (box 15). Enter \"IL\" so the withholding counts.",
    });
  }

  const joint = input.filingStatus === "marriedFilingJointly";
  const people = joint && input.spouse ? [input.taxpayer, input.spouse] : [input.taxpayer];

  // Step 2: income
  const taxExemptInterestAddition = args.taxExemptInterest; // line 2
  const otherAdditions = 0; // line 3, Schedule M
  const totalIncome = federalAgi + taxExemptInterestAddition + otherAdditions; // line 4
  const subtractions = args.usTreasuryInterest; // lines 5-8, Schedule M line 22
  const baseIncome = totalIncome - subtractions; // line 9

  // Step 4: exemptions (line 10)
  const highIncome = federalAgi > (joint ? p.highIncomeLimitJoint : p.highIncomeLimit);
  let exemptionAllowance = 0;
  if (!highIncome) {
    for (const person of people) {
      // Someone who can be claimed as a dependent gets the exemption only if
      // their Illinois base income is no more than the exemption amount.
      if (!person.canBeClaimedAsDependent || baseIncome <= p.exemptionAllowance) {
        exemptionAllowance += p.exemptionAllowance;
      }
      if (isAge65OrOlder(person, p.year)) exemptionAllowance += p.additionalExemption;
      if (person.blind) exemptionAllowance += p.additionalExemption;
    }
    exemptionAllowance += input.dependents.length * p.exemptionAllowance;
  }

  // Step 5: tax
  const netIncome = Math.max(0, baseIncome - exemptionAllowance); // line 11
  const tax = percentOf(netIncome, p.ratePercent); // lines 12-14

  // Schedule ICR: nonrefundable property tax and K-12 education credits.
  let propertyTaxCredit = 0;
  let k12EducationCredit = 0;
  if (!highIncome) {
    propertyTaxCredit = Math.min(percentOf(il.propertyTaxPaid, p.propertyTaxCreditPercent), tax);
    const k12 = Math.min(
      percentOf(Math.max(0, roundDollars(il.k12EducationExpenses) - p.k12Credit.floor), p.k12Credit.ratePercent),
      p.k12Credit.max,
    );
    k12EducationCredit = Math.min(k12, tax - propertyTaxCredit);
  }
  const taxAfterCredits = tax - propertyTaxCredit - k12EducationCredit;
  const useTax = roundDollars(il.useTax);
  const totalTax = taxAfterCredits + useTax;

  // Payments and refundable credits
  const withholding = sumToDollars([
    ...input.w2s.filter((w) => w.stateCode.toUpperCase() === "IL").map((w) => w.stateIncomeTaxWithheld),
    ...input.form1099Ints.map((f) => f.stateTaxWithheld),
    ...input.form1099Divs.map((f) => f.stateTaxWithheld),
    ...input.capitalAssetSales.map((s) => s.stateTaxWithheld),
    ...input.businesses.flatMap((b) => b.incomeForms.map((f) => f.stateTaxWithheld)),
  ]);
  const estimatedPayments = roundDollars(il.estimatedPayments);

  // Schedule IL-E/EITC: 20% of the federal EIC, also available to workers
  // without children from age 18 (no upper limit) and to ITIN filers.
  const ilEitcBase = earnedIncomeCredit(args.eitcInput, args.federalParams, {
    workerAge: { min: p.eicMinimumAgeWithoutChildren, max: Infinity },
    requireSsn: false,
  });
  const earnedIncomeCredit_ = percentOf(ilEitcBase.credit, p.earnedIncomeCreditPercent);
  const hasYoungChild = input.dependents.some((d) => ageAtEndOfYear(d.dateOfBirth, p.year) < p.childTaxCreditChildAgeLimit);
  const childTaxCredit = hasYoungChild ? percentOf(earnedIncomeCredit_, p.childTaxCreditPercentOfEic) : 0;

  const totalPayments = withholding + estimatedPayments + earnedIncomeCredit_ + childTaxCredit;
  return {
    federalAgi,
    taxExemptInterestAddition,
    otherAdditions,
    totalIncome,
    subtractions,
    baseIncome,
    exemptionAllowance,
    netIncome,
    tax,
    propertyTaxCredit,
    k12EducationCredit,
    taxAfterCredits,
    useTax,
    totalTax,
    withholding,
    estimatedPayments,
    earnedIncomeCredit: earnedIncomeCredit_,
    childTaxCredit,
    totalPayments,
    refund: Math.max(0, totalPayments - totalTax),
    amountOwed: Math.max(0, totalTax - totalPayments),
  };
}
