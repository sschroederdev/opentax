/**
 * Self-employment (Schedule C, Schedule SE, Form 8995) for 2026. Expected
 * values are worked by hand; comments show the arithmetic.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeReturn,
  emptyBusiness,
  emptyBusinessIncomeForm,
  emptyExpenses,
  emptyPerson,
  emptyReturn,
  TY2026,
  typicalW2,
} from "../src/index.ts";
import { scheduleSE } from "../src/income/selfEmployment.ts";
import { form8959 } from "../src/tax/otherTaxes.ts";

describe("freelancer with one 1099-NEC", () => {
  const result = computeReturn(
    emptyReturn({
      taxpayer: emptyPerson({ dateOfBirth: "1998-04-04" }),
      businesses: [
        emptyBusiness({
          name: "Design studio",
          incomeForms: [emptyBusinessIncomeForm({ payerName: "Client Co", amount: 40_000 })],
          expenses: emptyExpenses({ supplies: 2_000, meals: 1_000, utilities: 1_200 }),
          homeOfficeSquareFeet: 200,
        }),
      ],
      estimatedTaxPayments: 5_000,
    }),
  );
  const f = result.form1040;

  it("computes Schedule C net profit", () => {
    // Expenses 2,000 + 1,200 + 50% x 1,000 = 3,700; home office 200 x $5 = 1,000.
    const c = result.scheduleC[0]!;
    assert.equal(c.totalExpenses, 3_700);
    assert.equal(c.homeOfficeDeduction, 1_000);
    assert.equal(c.netProfit, 35_300);
  });

  it("computes self-employment tax", () => {
    // 35,300 x 92.35% = 32,599.55 -> 32,600; 12.4% = 4,042.40; 2.9% = 945.40
    const se = result.scheduleSE[0]!;
    assert.equal(se.netEarnings, 32_600);
    assert.equal(se.socialSecurityTax, 4_042);
    assert.equal(se.medicareTax, 945);
    assert.equal(se.selfEmploymentTax, 4_987);
    assert.equal(se.deduction, 2_494); // 2,493.50 rounds up
  });

  it("deducts half of SE tax and the QBI deduction", () => {
    // AGI 35,300 - 2,494 = 32,806; before QBI 32,806 - 16,100 = 16,706.
    // QBI 20% x 32,806 = 6,561, limited to 20% x 16,706 = 3,341.
    assert.equal(f.adjustedGrossIncome, 32_806);
    assert.equal(result.form8995!.qualifiedBusinessIncome, 32_806);
    assert.equal(f.qualifiedBusinessIncomeDeduction, 3_341);
    assert.equal(f.taxableIncome, 13_365);
  });

  it("adds SE tax to income tax", () => {
    // Midpoint 13,375: 1,240 + 12% x 975 = 1,357
    assert.equal(f.tax, 1_357);
    assert.equal(f.otherTaxes, 4_987);
    assert.equal(f.totalTax, 6_344);
    assert.equal(f.amountOwed, 1_344);
    assert.ok(result.diagnostics.some((d) => d.code === "form2210.penalty"));
  });
});

describe("QBI minimum deduction (2026)", () => {
  it("allows at least $400 with $1,000 or more of QBI", () => {
    const result = computeReturn(
      emptyReturn({
        w2s: [typicalW2(60_000, 6_000)],
        businesses: [emptyBusiness({ otherGrossReceipts: 1_500 })],
      }),
    );
    // SE: 1,500 x 92.35% = 1,385; 172 + 40 = 212; deduction 106.
    // QBI 1,394 x 20% = 279, raised to the $400 minimum.
    assert.equal(result.scheduleSE[0]!.deduction, 106);
    assert.equal(result.form8995!.qualifiedBusinessIncome, 1_394);
    assert.equal(result.form1040.qualifiedBusinessIncomeDeduction, 400);
  });
});

describe("Schedule SE with W-2 wages", () => {
  it("limits social security tax to the remaining wage base", () => {
    const se = scheduleSE(
      "taxpayer",
      [{ name: "x", owner: "taxpayer", grossReceipts: 0, grossIncome: 0, totalExpenses: 0, homeOfficeDeduction: 0, netProfit: 100_000 }],
      [typicalW2(150_000, 0)],
      TY2026,
    );
    // Net earnings 92,350; wage base left 184,500 - 150,000 = 34,500 x 12.4% = 4,278;
    // Medicare 2.9% x 92,350 = 2,678.15.
    assert.equal(se.netEarnings, 92_350);
    assert.equal(se.socialSecurityTax, 4_278);
    assert.equal(se.medicareTax, 2_678);
  });

  it("owes no SE tax under $400 of net earnings", () => {
    const se = scheduleSE(
      "taxpayer",
      [{ name: "x", owner: "taxpayer", grossReceipts: 0, grossIncome: 0, totalExpenses: 0, homeOfficeDeduction: 0, netProfit: 430 }],
      [],
      TY2026,
    );
    // 430 x 92.35% = 397
    assert.equal(se.selfEmploymentTax, 0);
  });

  it("applies Additional Medicare Tax to SE income over the remaining threshold", () => {
    // Threshold 200,000 - wages 150,000 = 50,000; 0.9% x (92,350 - 50,000) = 381.15
    const r = form8959("single", 150_000, 2_175, 92_350, TY2026);
    assert.equal(r.additionalMedicareTax, 381);
  });
});

describe("business losses", () => {
  it("offsets other income and can't use the home office deduction", () => {
    const result = computeReturn(
      emptyReturn({
        w2s: [typicalW2(40_000, 3_000)],
        businesses: [
          emptyBusiness({ otherGrossReceipts: 1_000, expenses: emptyExpenses({ supplies: 3_000 }), homeOfficeSquareFeet: 100 }),
        ],
      }),
    );
    assert.equal(result.scheduleC[0]!.homeOfficeDeduction, 0);
    assert.equal(result.form1040.additionalIncome, -2_000);
    assert.equal(result.form1040.adjustedGrossIncome, 38_000);
    assert.equal(result.scheduleSE[0]!.selfEmploymentTax, 0);
  });
});

describe("unsupported business situations", () => {
  it("flags depreciation", () => {
    const result = computeReturn(
      emptyReturn({ businesses: [emptyBusiness({ otherGrossReceipts: 5_000, expenses: emptyExpenses({ depreciation: 500 }) })] }),
    );
    assert.equal(result.complete, false);
  });
});
