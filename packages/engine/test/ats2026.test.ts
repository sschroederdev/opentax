/**
 * IRS Modernized e-File Assurance Testing System (ATS) scenarios for tax
 * year 2026 (posted September 2026 at irs.gov, "Tax Year 2026 Form 1040
 * Series ... ATS Information"), for the scenarios within OpenTax's scope.
 *
 * ATS scenarios supply the inputs; they are not answer keys. Expected
 * values here are worked by hand from the 2026 instructions. Where the
 * scenario's own filled-in amounts differ, the comment says why.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeReturn, emptyDependent, emptyPerson, emptyReturn, emptyW2 } from "../src/index.ts";

describe("ATS scenario 5 (single, one W-2, refund split on Form 8888)", () => {
  // Sam Wheat, born February 7, 1986, U.S. citizen. W-2 from Doughnut Castle.
  const result = computeReturn(
    emptyReturn({
      taxpayer: emptyPerson({ firstName: "Sam", lastName: "Wheat", dateOfBirth: "1986-02-07" }),
      citizenNationalOrQualifiedAlien: true,
      w2s: [
        emptyW2({
          employerName: "Doughnut Castle",
          wages: 50_510,
          federalWithholding: 10_268,
          socialSecurityWages: 50_510,
          socialSecurityTaxWithheld: 3_132,
          medicareWages: 50_510,
          medicareTaxWithheld: 732,
        }),
      ],
    }),
  );
  const f = result.form1040;

  it("computes the return", () => {
    // TI = 50,510 - 16,100 = 34,410. Tax Table row 34,400-34,450, midpoint
    // 34,425: 1,240 + 12% x (34,425 - 12,400) = 1,240 + 2,643 = 3,883.
    // No EIC: AGI is above $19,540, where the no-child credit ends.
    assert.equal(f.taxableIncome, 34_410);
    assert.equal(f.tax, 3_883);
    assert.equal(f.earnedIncomeCredit, 0);
    // Refund = 10,268 - 3,883 = 6,385. (Form 8888, splitting the refund
    // between accounts, isn't supported; it doesn't change the amount.)
    assert.equal(f.refund, 6_385);
    assert.equal(result.complete, true);
  });
});

describe("ATS scenario 14 (single with two children: EIC, Schedule 8812, Schedule 3-A)", () => {
  // John Rosen, U.S. citizen (Schedule 3-A line 32b is 0 on the scenario).
  // George (born 2016) and Abigail (born 2017) lived with him all year.
  // The scenario gives no dates of birth beyond the years; any 2016 and
  // 2017 dates give the same result.
  const result = computeReturn(
    emptyReturn({
      taxpayer: emptyPerson({ firstName: "John", lastName: "Rosen", dateOfBirth: "1985-01-01" }),
      citizenNationalOrQualifiedAlien: true,
      dependents: [
        emptyDependent({ firstName: "George", lastName: "Rosen", dateOfBirth: "2016-01-01" }),
        emptyDependent({ firstName: "Abigail", lastName: "Rosen", dateOfBirth: "2017-01-01" }),
      ],
      w2s: [
        emptyW2({
          employerName: "Willow Farms",
          wages: 35_000,
          federalWithholding: 2_000,
          socialSecurityWages: 35_000,
          socialSecurityTaxWithheld: 2_170,
          medicareWages: 35_000,
          medicareTaxWithheld: 508,
        }),
      ],
    }),
  );
  const f = result.form1040;

  it("computes tax from the Tax Table", () => {
    // TI = 35,000 - 16,100 = 18,900. Tax Table row 18,900-18,950, midpoint
    // 18,925: 1,240 + 12% x 6,525 = 2,023. (The scenario shows 2,020, the
    // rate schedule applied to 18,900 itself; the Tax Table governs below
    // $100,000.)
    assert.equal(f.taxableIncome, 18_900);
    assert.equal(f.tax, 2_023);
  });

  it("computes the child tax credit and ACTC", () => {
    // Line 8: 2 x 2,200 = 4,400; no phaseout. Line 14: limited to tax, 2,023.
    // Line 16a: 4,400 - 2,023 = 2,377; 16b: 2 x 1,700 = 3,400; line 17: 2,377.
    // Line 20: 15% x (35,000 - 2,500) = 4,875. ACTC = 2,377.
    assert.equal(f.childTaxCreditAndCreditForOtherDependents, 2_023);
    assert.equal(f.additionalChildTaxCredit, 2_377);
  });

  it("computes the EIC with 2026 amounts", () => {
    // Two children, single. EIC Table row 35,000-35,050, midpoint 35,025:
    // 7,316 - 21.06% x (35,025 - 23,890) = 7,316 - 2,345.03 = 4,971.
    // (The scenario shows 4,693, which is the 2025 table: 7,152 - 21.06% x
    // (35,025 - 23,350) = 4,693.)
    assert.equal(f.earnedIncomeCredit, 4_971);
  });

  it("pays the refundable credits to a citizen", () => {
    // Schedule 3-A: line 2 = 4,971 + 2,377 = 7,348 > line 5 = 0, but the
    // filer is a citizen, so line 8 (and 1040 line 32b) is 0.
    // Payments = 2,000 + 7,348 = 9,348; total tax 0; refund 9,348.
    assert.equal(result.scheduleThreeA?.federalPublicBenefit, 7_348);
    assert.equal(f.federalPublicBenefitReduction, 0);
    assert.equal(f.totalTax, 0);
    assert.equal(f.refund, 9_348);
  });
});
