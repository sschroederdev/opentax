import { percentOf, roundDollars, sumRounded, sumToDollars } from "../money.ts";
import type { FormW2, Owner, ScheduleCBusiness, ScheduleCResult, ScheduleSEResult } from "../types.ts";
import type { TaxYearParams } from "../years/index.ts";

/** Simplified home office method: $5 per square foot, up to 300 square feet. */
const HOME_OFFICE_RATE = 5;
const HOME_OFFICE_MAX_SQUARE_FEET = 300;

/** Schedule C, Profit or Loss From Business. */
export function scheduleC(business: ScheduleCBusiness): ScheduleCResult {
  const grossReceipts = sumToDollars([...business.incomeForms.map((f) => f.amount), business.otherGrossReceipts]); // line 1
  const netReceipts = grossReceipts - roundDollars(business.returnsAndAllowances); // line 3
  const grossProfit = netReceipts - roundDollars(business.costOfGoodsSold); // line 5
  const grossIncome = grossProfit + roundDollars(business.otherIncome); // line 7

  const { meals, ...fullyDeductible } = business.expenses;
  // Each expense is its own line (rounded); line 28 adds the lines.
  const totalExpenses = sumRounded(Object.values(fullyDeductible)) + percentOf(meals, 50); // line 28
  const tentativeProfit = grossIncome - totalExpenses; // line 29

  // The simplified home office deduction can't create or increase a loss.
  const squareFeet = Math.min(Math.max(0, business.homeOfficeSquareFeet), HOME_OFFICE_MAX_SQUARE_FEET);
  const homeOfficeDeduction = Math.max(0, Math.min(squareFeet * HOME_OFFICE_RATE, tentativeProfit)); // line 30

  return {
    name: business.name,
    owner: business.owner,
    grossReceipts,
    grossIncome,
    totalExpenses,
    homeOfficeDeduction,
    netProfit: tentativeProfit - homeOfficeDeduction, // line 31
  };
}

/**
 * Schedule SE for one person. Social security tax applies only up to the
 * wage base, less wages already subject to social security (W-2 boxes 3 and 7).
 */
export function scheduleSE(
  owner: Owner,
  businesses: ScheduleCResult[],
  w2s: FormW2[],
  params: TaxYearParams,
): ScheduleSEResult {
  const se = params.selfEmployment;
  const netProfit = businesses.filter((b) => b.owner === owner).reduce((sum, b) => sum + b.netProfit, 0); // line 2-3
  const line4a = netProfit > 0 ? percentOf(netProfit, se.netEarningsPercent) : netProfit;
  const netEarnings = line4a < se.minimumNetEarnings ? 0 : line4a; // lines 4c and 6

  const socialSecurityWages = sumToDollars(
    w2s.filter((w) => w.owner === owner).flatMap((w) => [w.socialSecurityWages, w.socialSecurityTips]),
  ); // line 8d
  const remainingWageBase = Math.max(0, params.socialSecurity.wageBase - socialSecurityWages); // line 9
  const socialSecurityTax = percentOf(Math.min(netEarnings, remainingWageBase), se.socialSecurityRatePercent); // line 10
  const medicareTax = percentOf(netEarnings, se.medicareRatePercent); // line 11
  const selfEmploymentTax = socialSecurityTax + medicareTax; // line 12

  return {
    owner,
    netProfit,
    line4a,
    netEarnings,
    socialSecurityWages,
    socialSecurityTax,
    medicareTax,
    selfEmploymentTax,
    deduction: percentOf(selfEmploymentTax, 50), // line 13
  };
}
