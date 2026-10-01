import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { earnedIncomeCredit, eitcCompletedPhaseout, eitcTableAmount } from "../src/credits/earnedIncomeCredit.ts";
import { emptyPerson, TY2025 } from "../src/index.ts";

const [none, one, two, three] = TY2025.eitc;

describe("EIC table amounts (2025)", () => {
  it("is zero with no income", () => {
    assert.equal(eitcTableAmount(0, one, false), 0);
  });

  it("phases in at the credit rate", () => {
    // Midpoint 10,025 x 34% = 3,408.50
    assert.equal(eitcTableAmount(10_000, one, false), 3_409);
  });

  it("reaches the maximum credit on the plateau", () => {
    assert.equal(eitcTableAmount(20_000, one, false), 4_328);
    assert.equal(eitcTableAmount(20_000, two, false), 7_152);
    assert.equal(eitcTableAmount(20_000, three, false), 8_046);
    assert.equal(eitcTableAmount(9_000, none, false), 649);
  });

  it("phases out above the threshold", () => {
    // Midpoint 15,025: 649 - 7.65% x (15,025 - 10,620) = 312.02
    assert.equal(eitcTableAmount(15_000, none, false), 312);
    // Joint threshold is higher: 649 - 7.65% x (20,025 - 17,730) = 473.43
    assert.equal(eitcTableAmount(20_000, none, true), 473);
  });

  it("computes the published completed-phaseout amounts", () => {
    assert.deepEqual(
      [none, one, two, three].map((s) => eitcCompletedPhaseout(s, false)),
      [19_104, 50_434, 57_310, 61_555],
    );
    assert.deepEqual(
      [none, one, two, three].map((s) => eitcCompletedPhaseout(s, true)),
      [26_214, 57_554, 64_430, 68_675],
    );
  });

  it("reaches zero at the completed-phaseout amounts", () => {
    assert.equal(eitcTableAmount(50_433, one, false), 1);
    assert.equal(eitcTableAmount(19_104, none, false), 0);
    assert.equal(eitcTableAmount(50_434, one, false), 0);
    assert.equal(eitcTableAmount(57_310, two, false), 0);
    assert.equal(eitcTableAmount(61_555, three, false), 0);
    assert.equal(eitcTableAmount(68_675, three, true), 0);
    assert.ok(eitcTableAmount(61_400, three, false) > 0);
  });
});

describe("EIC eligibility", () => {
  const base = {
    status: "single" as const,
    filers: [emptyPerson({ dateOfBirth: "1990-05-05" })],
    qualifyingChildren: 0,
    earnedIncome: 9_000,
    adjustedGrossIncome: 9_000,
    investmentIncome: 0,
    mainHomeInUsMoreThanHalfYear: true,
    livedApartFromSpouseLastSixMonths: false,
  };

  it("allows a 35-year-old with no children", () => {
    const r = earnedIncomeCredit(base, TY2025);
    assert.equal(r.eligible, true);
    assert.equal(r.credit, 649);
  });

  it("requires age 25 to 64 without children", () => {
    const young = earnedIncomeCredit({ ...base, filers: [emptyPerson({ dateOfBirth: "2002-03-01" })] }, TY2025);
    assert.equal(young.eligible, false);
    // Born January 1, 2001: treated as 25 at the end of 2025.
    const jan1 = earnedIncomeCredit({ ...base, filers: [emptyPerson({ dateOfBirth: "2001-01-01" })] }, TY2025);
    assert.equal(jan1.eligible, true);
  });

  it("denies the credit when investment income is too high", () => {
    const r = earnedIncomeCredit({ ...base, investmentIncome: 11_951 }, TY2025);
    assert.equal(r.eligible, false);
    assert.equal(r.credit, 0);
  });

  it("uses the smaller of the earned income and AGI amounts in the phaseout range", () => {
    const r = earnedIncomeCredit(
      { ...base, qualifyingChildren: 1, earnedIncome: 20_000, adjustedGrossIncome: 30_000, investmentIncome: 10_000 },
      TY2025,
    );
    // AGI midpoint 30,025: 4,328 - 15.98% x 6,675 = 3,261.34
    assert.equal(r.credit, 3_261);
  });

  it("denies married filing separately without the separation exception", () => {
    const r = earnedIncomeCredit({ ...base, status: "marriedFilingSeparately", qualifyingChildren: 1 }, TY2025);
    assert.equal(r.eligible, false);
    const separated = earnedIncomeCredit(
      { ...base, status: "marriedFilingSeparately", qualifyingChildren: 1, livedApartFromSpouseLastSixMonths: true },
      TY2025,
    );
    assert.equal(separated.eligible, true);
  });
});
