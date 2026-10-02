import { percentOf, roundDollars } from "@opentax/engine";
import { personHeader } from "../common.ts";
import { amount, amountOrZero, compact } from "../format.ts";
import type { FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";

const fields = {
  "1": { name: "topmostSubform[0].Page1[0].f1_13[0]", tooltip: "1. Amount." },
  "2": { name: "topmostSubform[0].Page1[0].f1_14[0]", tooltip: "2. Returns and allowances." },
  "3": { name: "topmostSubform[0].Page1[0].f1_15[0]", tooltip: "3. Subtract line 2 from line 1." },
  "4": { name: "topmostSubform[0].Page1[0].f1_16[0]", tooltip: "4. Cost of goods sold (from line 42)." },
  "5": { name: "topmostSubform[0].Page1[0].f1_17[0]", tooltip: "5. Gross profit. Subtract line 4 from line 3." },
  "6": { name: "topmostSubform[0].Page1[0].f1_18[0]", tooltip: "6. Other income, including federal and state gas" },
  "7": { name: "topmostSubform[0].Page1[0].f1_19[0]", tooltip: "7. Gross income. Add lines 5 and 6." },
  "8": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_20[0]", tooltip: "8. Advertising." },
  "9": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_21[0]", tooltip: "9. Car and truck expenses (see instructions)." },
  "10": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_22[0]", tooltip: "10. Commissions and fees." },
  "11": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_23[0]", tooltip: "11. Contract labor (see instructions)." },
  "13": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_25[0]", tooltip: "13. Depreciation and section 179 expense deducti" },
  "14": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_26[0]", tooltip: "14. Employee benefit programs (other than on lin" },
  "15": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_27[0]", tooltip: "15. Insurance (other than health)." },
  "17": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_32[0]", tooltip: "17. Legal and professional services." },
  "18": { name: "topmostSubform[0].Page1[0].f1_33[0]", tooltip: "18. Office expense (see instructions)." },
  "19": { name: "topmostSubform[0].Page1[0].f1_34[0]", tooltip: "19. Pension and profit-sharing plans." },
  "21": { name: "topmostSubform[0].Page1[0].f1_37[0]", tooltip: "21. Repairs and maintenance." },
  "22": { name: "topmostSubform[0].Page1[0].f1_38[0]", tooltip: "22. Supplies (not included in Part I I I)." },
  "23": { name: "topmostSubform[0].Page1[0].f1_39[0]", tooltip: "23. Taxes and licenses." },
  "25": { name: "topmostSubform[0].Page1[0].f1_42[0]", tooltip: "25. Utilities." },
  "26": { name: "topmostSubform[0].Page1[0].f1_43[0]", tooltip: "26. Wages (less employment credits)." },
  "28": { name: "topmostSubform[0].Page1[0].f1_46[0]", tooltip: "28. Total expenses before expenses for business" },
  "29": { name: "topmostSubform[0].Page1[0].f1_47[0]", tooltip: "29. Tentative profit or (loss). Subtract line 28" },
  "30": { name: "topmostSubform[0].Page1[0].f1_50[0]", tooltip: "30. Use the Simplified Method Worksheet in the i" },
  "31": { name: "topmostSubform[0].Page1[0].f1_51[0]", tooltip: "31. Net profit or (loss). Subtract line 30 from" },
  "48": { name: "topmostSubform[0].Page2[0].f2_33[0]", tooltip: "48. Total other expenses. Enter here and on line" },
  "name": { name: "topmostSubform[0].Page1[0].f1_1[0]", tooltip: "Page 1. Name of proprietor." },
  "ssn": { name: "topmostSubform[0].Page1[0].f1_2[0]", tooltip: "Social security number (S S N)." },
  "A": { name: "topmostSubform[0].Page1[0].f1_3[0]", tooltip: "A. Principal business or profession, including p" },
  "B": { name: "topmostSubform[0].Page1[0].f1_4[0]", tooltip: "B. Enter code from instructions." },
  "C": { name: "topmostSubform[0].Page1[0].f1_5[0]", tooltip: "C. Business name. If no separate business name," },
  "D": { name: "topmostSubform[0].Page1[0].BoxD[0].f1_6[0]", tooltip: "D. Employer I D number (E I N), (see instr.)." },
  "F_cash": { name: "topmostSubform[0].Page1[0].c1_1[0]", tooltip: "F. Accounting method: (1). Cash." },
  "G_yes": { name: "topmostSubform[0].Page1[0].c1_2[0]", tooltip: "G. Did you \"materially participate\" in the opera" },
  "G_no": { name: "topmostSubform[0].Page1[0].c1_2[1]", tooltip: "G. If \"No,\" see instructions for limit on losses" },
  "16a": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_28[0]", tooltip: "nstructions): a. Mortgage (paid to banks, etc.)." },
  "16c": { name: "topmostSubform[0].Page1[0].Lines8-16c_ReadOrder[0].f1_31[0]", tooltip: "16c. Other." },
  "20a": { name: "topmostSubform[0].Page1[0].f1_35[0]", tooltip: "uctions): a. Vehicles, machinery, and equipment." },
  "20b": { name: "topmostSubform[0].Page1[0].f1_36[0]", tooltip: "20b. Other business property." },
  "24a": { name: "topmostSubform[0].Page1[0].f1_40[0]", tooltip: "24. Travel and meals: a. Travel." },
  "24b": { name: "topmostSubform[0].Page1[0].f1_41[0]", tooltip: "24b. Deductible meals (see instructions)." },
  "27b": { name: "topmostSubform[0].Page1[0].f1_45[0]", tooltip: "27b. Other expenses (from line 48)." },
  "30b": { name: "topmostSubform[0].Page1[0].Line30_ReadOrder[0].f1_49[0]", tooltip: "and (b) the part of your home used for business:" },
  "32a": { name: "topmostSubform[0].Page1[0].c1_7[0]", tooltip: "ss may be limited. a. All investment is at risk." },
  "32b": { name: "topmostSubform[0].Page1[0].c1_7[1]", tooltip: "32b. Some investment is not at risk." },
  "48.1.description": { name: "topmostSubform[0].Page2[0].f2_15[0]", tooltip: "on lines 8–27a, or line 30. Business expense. 1." },
  "48.1.amount": { name: "topmostSubform[0].Page2[0].f2_16[0]", tooltip: "Amount. 1." },
};

type Key = keyof typeof fields;

export const SCHEDULE_C: FormDefinition<Key> = {
  id: "f1040sc",
  title: "Schedule C (Form 1040)",
  year: 2026,
  file: "f1040sc.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040sc--dft.pdf",
  revision: "Draft created 5/15/26",
  coverPages: 1,
  fields,
};

/** One Schedule C for each business. */
export function fillScheduleC(ctx: FormContext, notes: PacketNote[]): FilledForm<Key>[] {
  return ctx.input.businesses.map((business, i) => {
    const c = ctx.result.scheduleC[i]!;
    const e = business.expenses;
    const header = personHeader(ctx, business.owner);
    const line = (dollars: number) => amount(roundDollars(dollars));
    const returns = roundDollars(business.returnsAndAllowances);
    const cogs = roundDollars(business.costOfGoodsSold);
    const label = business.name || `Business ${i + 1}`;
    notes.push({
      form: `Schedule C (${label})`,
      message: "Check the accounting method on line F and answer lines H through J."
        + (business.homeOfficeSquareFeet > 0 ? " Enter your home's total square footage on line 30(a)." : "")
        + (c.netProfit < 0 ? " Check box 32a or 32b." : ""),
    });
    return {
      form: SCHEDULE_C,
      label,
      values: compact<Key>({
        name: header.name,
        ssn: header.ssn,
        A: business.name,
        B: business.principalBusinessCode,
        [business.materiallyParticipated ? "G_yes" : "G_no"]: true,
        "1": amount(c.grossReceipts),
        "2": amount(returns),
        "3": amount(c.grossReceipts - returns),
        "4": amount(cogs),
        "5": amount(c.grossReceipts - returns - cogs),
        "6": line(business.otherIncome),
        "7": amount(c.grossIncome),
        "8": line(e.advertising),
        "9": line(e.carAndTruck),
        "10": line(e.commissionsAndFees),
        "11": line(e.contractLabor),
        "13": line(e.depreciation),
        "14": line(e.employeeBenefitPrograms),
        "15": line(e.insurance),
        "16a": line(e.mortgageInterest),
        "16c": line(e.otherInterest),
        "17": line(e.legalAndProfessional),
        "18": line(e.officeExpense),
        "19": line(e.pensionAndProfitSharing),
        "20a": line(e.rentVehiclesAndEquipment),
        "20b": line(e.rentOtherProperty),
        "21": line(e.repairsAndMaintenance),
        "22": line(e.supplies),
        "23": line(e.taxesAndLicenses),
        "24a": line(e.travel),
        "24b": amount(percentOf(e.meals, 50)),
        "25": line(e.utilities),
        "26": line(e.wages),
        "27b": line(e.other),
        "28": amount(c.totalExpenses),
        "29": amount(c.grossIncome - c.totalExpenses),
        "30b": business.homeOfficeSquareFeet > 0 ? String(business.homeOfficeSquareFeet) : "",
        "30": amount(c.homeOfficeDeduction),
        "31": amountOrZero(c.netProfit),
        ...(roundDollars(e.other) !== 0 && {
          "48.1.description": "Other business expenses",
          "48.1.amount": line(e.other),
          "48": line(e.other),
        }),
      }),
    };
  });
}
