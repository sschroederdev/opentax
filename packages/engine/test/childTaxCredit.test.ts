import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { schedule8812 } from "../src/credits/childTaxCredit.ts";
import { TY2025 } from "../src/index.ts";

const base = {
  status: "single" as const,
  qualifyingChildren: 1,
  otherDependents: 0,
  modifiedAgi: 50_000,
  creditLimit: 10_000,
  earnedIncome: 50_000,
  socialSecurityAndMedicareWithheld: 0,
  selfEmploymentTaxDeduction: 0,
  earnedIncomeCredit: 0,
  excessSocialSecurityWithheld: 0,
};

describe("Schedule 8812 (2025)", () => {
  it("gives $2,200 per child and $500 per other dependent", () => {
    const r = schedule8812({ ...base, qualifyingChildren: 2, otherDependents: 1 }, TY2025);
    assert.equal(r.creditBeforePhaseout, 4_900);
    assert.equal(r.nonrefundableCredit, 4_900);
    assert.equal(r.additionalChildTaxCredit, 0);
  });

  it("phases out $50 per $1,000 or fraction over the threshold", () => {
    const r = schedule8812({ ...base, modifiedAgi: 200_001 }, TY2025);
    // Line 10: $1 over, rounded up to $1,000; line 11: 1 x $50.
    assert.equal(r.excessOverThreshold, 1_000);
    assert.equal(r.phaseoutReduction, 50);
    const joint = schedule8812(
      { ...base, status: "marriedFilingJointly", qualifyingChildren: 2, modifiedAgi: 420_000, creditLimit: 80_000 },
      TY2025,
    );
    assert.equal(joint.creditAfterPhaseout, 3_400);
  });

  it("refunds up to $1,700 per child, limited to 15% of earnings over $2,500", () => {
    const r = schedule8812({ ...base, creditLimit: 0, earnedIncome: 20_000 }, TY2025);
    assert.equal(r.nonrefundableCredit, 0);
    assert.equal(r.additionalChildTaxCredit, 1_700);
    const lowEarner = schedule8812({ ...base, creditLimit: 0, earnedIncome: 6_000 }, TY2025);
    assert.equal(lowEarner.additionalChildTaxCredit, 525); // 15% x 3,500
  });

  it("does not refund the credit for other dependents", () => {
    const r = schedule8812({ ...base, qualifyingChildren: 0, otherDependents: 2, creditLimit: 0 }, TY2025);
    assert.equal(r.additionalChildTaxCredit, 0);
  });

  it("lets three or more children use social security and Medicare taxes", () => {
    const r = schedule8812(
      { ...base, qualifyingChildren: 3, creditLimit: 0, earnedIncome: 10_000, socialSecurityAndMedicareWithheld: 2_000 },
      TY2025,
    );
    // Line 20: 15% x 7,500 = 1,125; Part II-B line 25: 2,000. Refund the larger.
    assert.equal(r.additionalChildTaxCredit, 2_000);
  });

  it("adds the deductible part of self-employment tax on Part II-B line 22", () => {
    const r = schedule8812(
      {
        ...base,
        qualifyingChildren: 3,
        creditLimit: 0,
        earnedIncome: 10_000,
        socialSecurityAndMedicareWithheld: 2_000,
        selfEmploymentTaxDeduction: 500,
        earnedIncomeCredit: 300,
      },
      TY2025,
    );
    // Line 16a: 3 x 2,200 = 6,600; 16b: 3 x 1,700 = 5,100; 17: 5,100;
    // 19: 10,000 - 2,500 = 7,500; 20: 15% = 1,125, less than line 17.
    assert.deepEqual(r.partTwoA, { line16a: 6_600, line16b: 5_100, line17: 5_100, line18a: 10_000, line19: 7_500, line20: 1_125 });
    // Line 23: 2,000 + 500 = 2,500; 24: EIC 300; 25: 2,200; 26: larger of 1,125 and 2,200.
    assert.deepEqual(r.partTwoB, { line21: 2_000, line22: 500, line23: 2_500, line24: 300, line25: 2_200, line26: 2_200 });
    // Line 27: smaller of line 17 (5,100) and line 26.
    assert.equal(r.additionalChildTaxCredit, 2_200);
  });
});
