/**
 * Illinois IL-1040 for 2026. Expected values are worked by hand; comments
 * show the arithmetic.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeReturn,
  emptyDependent,
  emptyIllinois,
  emptyPerson,
  emptyReturn,
  typicalW2,
} from "../src/index.ts";

const ilW2 = (wages: number, federal: number, state: number) =>
  typicalW2(wages, federal, { stateCode: "IL", stateWages: wages, stateIncomeTaxWithheld: state });

describe("young single worker", () => {
  const result = computeReturn(
    emptyReturn({
      taxpayer: emptyPerson({ dateOfBirth: "2006-02-02" }),
      w2s: [ilW2(12_000, 200, 300)],
      illinois: emptyIllinois(),
    }),
  );
  const il = result.illinois!;

  it("gets no federal EIC under age 25", () => {
    assert.equal(result.form1040.earnedIncomeCredit, 0);
  });

  it("gets the Illinois EIC from age 18", () => {
    // Federal-style credit: 664 - 7.65% x (12,025 - 10,860) = 575; 20% = 115.
    assert.equal(il.earnedIncomeCredit, 115);
  });

  it("computes Illinois tax", () => {
    // 12,000 - 2,925 = 9,075 x 4.95% = 449.21
    assert.equal(il.baseIncome, 12_000);
    assert.equal(il.exemptionAllowance, 2_925);
    assert.equal(il.tax, 449);
    assert.equal(il.totalPayments, 415);
    assert.equal(il.amountOwed, 34);
  });
});

describe("family with young children", () => {
  const result = computeReturn(
    emptyReturn({
      filingStatus: "marriedFilingJointly",
      spouse: emptyPerson({ dateOfBirth: "1991-05-05" }),
      dependents: [emptyDependent({ dateOfBirth: "2021-03-03" }), emptyDependent({ dateOfBirth: "2017-07-07" })],
      w2s: [ilW2(45_000, 1_000, 1_500)],
      illinois: emptyIllinois({ propertyTaxPaid: 4_000, k12EducationExpenses: 1_000 }),
    }),
  );
  const f = result.form1040;
  const il = result.illinois!;

  it("computes the federal credits", () => {
    // TI 12,800 -> midpoint 12,825 x 10% = 1,282.50 -> 1,283; CTC 4,400.
    assert.equal(f.tax, 1_283);
    assert.equal(f.childTaxCreditAndCreditForOtherDependents, 1_283);
    // ACTC: min(4,400 - 1,283, 2 x 1,700, 15% x 42,500) = 3,117
    assert.equal(f.additionalChildTaxCredit, 3_117);
    // EIC: 7,316 - 21.06% x (45,025 - 31,160) = 4,396.03
    assert.equal(f.earnedIncomeCredit, 4_396);
  });

  it("allows four exemptions", () => {
    assert.equal(il.exemptionAllowance, 4 * 2_925);
    // 33,300 x 4.95% = 1,648.35
    assert.equal(il.tax, 1_648);
  });

  it("takes the property tax and K-12 credits", () => {
    // 5% x 4,000 = 200; 25% x (1,000 - 250) = 187.50 -> 188
    assert.equal(il.propertyTaxCredit, 200);
    assert.equal(il.k12EducationCredit, 188);
    assert.equal(il.taxAfterCredits, 1_260);
  });

  it("adds the Illinois EIC and child tax credit", () => {
    // 20% x 4,396 = 879.20; 40% x 879 = 351.60
    assert.equal(il.earnedIncomeCredit, 879);
    assert.equal(il.childTaxCredit, 352);
    assert.equal(il.refund, 1_500 + 879 + 352 - 1_260);
  });
});

describe("Illinois exemption rules", () => {
  it("allows a dependent's exemption only if base income is $2,925 or less", () => {
    const run = (wages: number) =>
      computeReturn(
        emptyReturn({
          taxpayer: emptyPerson({ canBeClaimedAsDependent: true }),
          w2s: [ilW2(wages, 0, 0)],
          illinois: emptyIllinois(),
        }),
      ).illinois!;
    assert.equal(run(2_500).exemptionAllowance, 2_925);
    assert.equal(run(5_000).exemptionAllowance, 0);
    assert.equal(run(5_000).tax, 248); // 4.95% x 5,000 = 247.50
  });

  it("removes exemptions above $250,000 AGI", () => {
    const il = computeReturn(emptyReturn({ w2s: [ilW2(260_000, 0, 0)], illinois: emptyIllinois() })).illinois!;
    assert.equal(il.exemptionAllowance, 0);
  });

  it("adds $1,000 for age 65 or older", () => {
    const il = computeReturn(
      emptyReturn({
        taxpayer: emptyPerson({ dateOfBirth: "1955-01-10" }),
        w2s: [ilW2(30_000, 0, 0)],
        illinois: emptyIllinois(),
      }),
    ).illinois!;
    assert.equal(il.exemptionAllowance, 3_925);
  });
});

describe("Illinois income adjustments", () => {
  it("adds tax-exempt interest and subtracts US Treasury interest", async () => {
    const { empty1099Int } = await import("../src/index.ts");
    const il = computeReturn(
      emptyReturn({
        w2s: [ilW2(40_000, 0, 0)],
        form1099Ints: [
          empty1099Int({ payerName: "Muni fund", taxExemptInterest: 300 }),
          empty1099Int({ payerName: "TreasuryDirect", usSavingsBondAndTreasuryInterest: 500 }),
        ],
        illinois: emptyIllinois(),
      }),
    ).illinois!;
    assert.equal(il.federalAgi, 40_500);
    assert.equal(il.baseIncome, 40_500 + 300 - 500);
  });

  it("flags part-year residents and other-state wages", () => {
    const result = computeReturn(
      emptyReturn({
        w2s: [typicalW2(40_000, 0, { stateCode: "IN" })],
        illinois: emptyIllinois({ residency: "partYear" }),
      }),
    );
    assert.ok(result.diagnostics.some((d) => d.code === "il.residency"));
    assert.ok(result.diagnostics.some((d) => d.code === "il.otherStates"));
    assert.equal(result.complete, false);
  });
});
