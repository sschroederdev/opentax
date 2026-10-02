/** Schedule 1-A tips and overtime deductions, and the 2026 charitable deduction. */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeReturn, emptyPerson, emptyReturn, typicalW2 } from "../src/index.ts";

describe("qualified tips", () => {
  it("deducts tips below the line", () => {
    const result = computeReturn(emptyReturn({ w2s: [typicalW2(30_000, 1_500, { qualifiedTips: 2_000 })] }));
    // AGI is unchanged; TI = 30,000 - 16,100 - 2,000 = 11,900; midpoint 11,925 x 10%.
    assert.equal(result.form1040.adjustedGrossIncome, 30_000);
    assert.equal(result.scheduleOneA.tips, 2_000);
    assert.equal(result.form1040.taxableIncome, 11_900);
    assert.equal(result.form1040.tax, 1_193);
  });

  it("caps tips at $25,000 and phases out $100 per full $1,000 over $150,000", () => {
    const capped = computeReturn(emptyReturn({ w2s: [typicalW2(90_000, 0, { qualifiedTips: 30_000 })] }));
    assert.equal(capped.scheduleOneA.tips, 25_000);
    // MAGI 160,500: 10 full thousands over -> $1,000 reduction.
    const phased = computeReturn(emptyReturn({ w2s: [typicalW2(160_500, 0, { qualifiedTips: 10_000 })] }));
    assert.equal(phased.scheduleOneA.tips, 9_000);
  });

  it("is not allowed married filing separately", () => {
    const result = computeReturn(
      emptyReturn({ filingStatus: "marriedFilingSeparately", w2s: [typicalW2(30_000, 0, { qualifiedTips: 2_000 })] }),
    );
    assert.equal(result.scheduleOneA.tips, 0);
  });

  it("requires a valid SSN", () => {
    const result = computeReturn(
      emptyReturn({
        taxpayer: emptyPerson({ hasValidSsn: false }),
        w2s: [typicalW2(30_000, 0, { qualifiedTips: 2_000 })],
      }),
    );
    assert.equal(result.scheduleOneA.tips, 0);
  });
});

describe("qualified overtime", () => {
  it("caps a joint return at $25,000", () => {
    const result = computeReturn(
      emptyReturn({
        filingStatus: "marriedFilingJointly",
        spouse: emptyPerson(),
        w2s: [
          typicalW2(80_000, 0, { qualifiedOvertimeCompensation: 10_000 }),
          typicalW2(70_000, 0, { owner: "spouse", qualifiedOvertimeCompensation: 20_000 }),
        ],
      }),
    );
    assert.equal(result.scheduleOneA.overtime, 25_000);
  });

  it("caps a single return at $12,500", () => {
    const result = computeReturn(emptyReturn({ w2s: [typicalW2(80_000, 0, { qualifiedOvertimeCompensation: 15_000 })] }));
    assert.equal(result.scheduleOneA.overtime, 12_500);
  });
});

describe("charitable deduction without itemizing", () => {
  it("allows up to $1,000 single and $2,000 joint in 2026", () => {
    const single = computeReturn(emptyReturn({ w2s: [typicalW2(50_000, 0)], charitableCashContributions: 1_500 }));
    assert.equal(single.form1040.charitableDeduction, 1_000);
    assert.equal(single.form1040.taxableIncome, 50_000 - 16_100 - 1_000);
    const joint = computeReturn(
      emptyReturn({
        filingStatus: "marriedFilingJointly",
        spouse: emptyPerson(),
        w2s: [typicalW2(50_000, 0)],
        charitableCashContributions: 2_500,
      }),
    );
    assert.equal(joint.form1040.charitableDeduction, 2_000);
  });

  it("does not exist in 2025", () => {
    const result = computeReturn(emptyReturn({ taxYear: 2025, charitableCashContributions: 500 }));
    assert.equal(result.form1040.charitableDeduction, 0);
    assert.ok(result.diagnostics.some((d) => d.code === "charitable.year"));
  });
});
