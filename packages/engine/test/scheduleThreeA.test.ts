/**
 * Schedule 3-A (Federal Public Benefit), new on the 2026 draft Form 1040.
 * Expected values are worked by hand; comments show the arithmetic.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeReturn,
  emptyBusiness,
  emptyBusinessIncomeForm,
  emptyDependent,
  emptyReturn,
  typicalW2,
  type TaxReturnInput,
} from "../src/index.ts";

// Head of household, one child (age 11 in 2026), $22,000 of wages, no withholding.
// TI = 22,000 - 24,150 < 0 -> 0, so tax is 0.
// EIC, one child: earned income 22,000 is past the $13,020 earned income amount
// and AGI is below the $23,890 phaseout, so the maximum $4,427.
// CTC: limited by tax of 0. ACTC = min(1,700, 15% x (22,000 - 2,500) = 2,925) = 1,700.
// Schedule 3-A: line 2 = 4,427 + 1,700 = 6,127; line 5 = 0 - 0 = 0; line 6 = 6,127.
const wageEarner = (overrides: Partial<TaxReturnInput>) =>
  computeReturn(
    emptyReturn({
      filingStatus: "headOfHousehold",
      dependents: [emptyDependent({ firstName: "Kid" })],
      w2s: [typicalW2(22_000, 0)],
      ...overrides,
    }),
  );

describe("Schedule 3-A with no income tax", () => {
  it("pays the credits to a citizen", () => {
    const result = wageEarner({ citizenNationalOrQualifiedAlien: true });
    assert.equal(result.form1040.earnedIncomeCredit, 4_427);
    assert.equal(result.form1040.additionalChildTaxCredit, 1_700);
    assert.equal(result.scheduleThreeA?.federalPublicBenefit, 6_127);
    assert.equal(result.form1040.federalPublicBenefitReduction, 0);
    assert.equal(result.form1040.totalPayments, 6_127);
    assert.equal(result.form1040.refund, 6_127);
    assert.equal(result.complete, true);
  });

  it("withholds the benefit when neither spouse is a citizen, national, or qualified alien", () => {
    const result = wageEarner({ citizenNationalOrQualifiedAlien: false });
    assert.equal(result.form1040.federalPublicBenefitReduction, 6_127);
    assert.equal(result.form1040.totalPayments, 0);
    assert.equal(result.form1040.refund, 0);
    assert.ok(result.diagnostics.some((d) => d.code === "scheduleThreeA.reduction"));
  });

  it("flags an unanswered question and leaves the benefit out", () => {
    const result = wageEarner({ citizenNationalOrQualifiedAlien: null });
    assert.equal(result.form1040.federalPublicBenefitReduction, 6_127);
    assert.ok(result.diagnostics.some((d) => d.code === "scheduleThreeA.status" && d.severity === "error"));
    assert.equal(result.complete, false);
  });

  it("does not apply to 2025 returns", () => {
    // 2025: the question doesn't exist, so leaving it unanswered is fine.
    const result = computeReturn(
      emptyReturn({
        taxYear: 2025,
        filingStatus: "headOfHousehold",
        dependents: [emptyDependent()],
        w2s: [typicalW2(22_000, 0, {}, 2025)],
      }),
    );
    assert.equal(result.scheduleThreeA, null);
    assert.equal(result.form1040.federalPublicBenefitReduction, 0);
    assert.ok(result.form1040.earnedIncomeCredit > 0);
  });
});

describe("Schedule 3-A offsets self-employment tax first", () => {
  // Head of household, one child, Schedule C net profit $20,000.
  // SE: 20,000 x 92.35% = 18,470; SS 18,470 x 12.4% = 2,290.28 -> 2,290;
  //   Medicare 18,470 x 2.9% = 535.63 -> 536; SE tax 2,826; deduction 1,413.
  // AGI = 20,000 - 1,413 = 18,587; TI 0; tax 0. Earned income 18,587.
  // EIC: 18,587 >= 13,020 and AGI < 23,890 -> 4,427.
  // ACTC = min(1,700, 15% x (18,587 - 2,500) = 2,413.05) = 1,700.
  // Line 2 = 6,127; line 5 = total tax 2,826 - Schedule 2 line 20 (0) = 2,826;
  // line 6 = 6,127 - 2,826 = 3,301.
  const result = computeReturn(
    emptyReturn({
      filingStatus: "headOfHousehold",
      dependents: [emptyDependent()],
      businesses: [emptyBusiness({ incomeForms: [emptyBusinessIncomeForm({ amount: 20_000 })] })],
      citizenNationalOrQualifiedAlien: false,
    }),
  );

  it("computes the benefit as credits in excess of total tax", () => {
    assert.equal(result.form1040.totalTax, 2_826);
    assert.equal(result.scheduleThreeA?.federalPublicBenefit, 3_301);
  });

  it("keeps the credits that offset tax", () => {
    // Payments 6,127 - 3,301 = 2,826, exactly the total tax: no refund, nothing owed.
    assert.equal(result.form1040.totalPayments, 2_826);
    assert.equal(result.form1040.refund, 0);
    assert.equal(result.form1040.amountOwed, 0);
  });
});
