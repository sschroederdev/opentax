/**
 * End-to-end returns. Expected values are worked by hand from the 2025 Form
 * 1040 instructions; the comments show the arithmetic.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeReturn,
  empty1099Div,
  empty1099Int,
  emptyDependent,
  emptyPerson,
  emptyReturn,
  emptyScreening,
  typicalW2,
  UnsupportedTaxYearError,
} from "../src/index.ts";

describe("single filer with one W-2", () => {
  const result = computeReturn(emptyReturn({ w2s: [typicalW2(50_000, 5_000)] }));
  const f = result.form1040;

  it("computes income, deduction, and tax", () => {
    assert.equal(f.adjustedGrossIncome, 50_000);
    assert.equal(f.standardDeduction, 15_750);
    assert.equal(f.taxableIncome, 34_250);
    assert.equal(f.tax, 3_875);
    assert.equal(f.totalTax, 3_875);
  });

  it("computes the refund", () => {
    assert.equal(f.totalPayments, 5_000);
    assert.equal(f.refund, 1_125);
    assert.equal(f.amountOwed, 0);
  });

  it("is complete with no diagnostics", () => {
    assert.deepEqual(result.diagnostics, []);
    assert.equal(result.complete, true);
  });
});

describe("married couple with two young children", () => {
  const result = computeReturn(
    emptyReturn({
      filingStatus: "marriedFilingJointly",
      spouse: emptyPerson({ dateOfBirth: "1988-02-02" }),
      dependents: [emptyDependent({ dateOfBirth: "2020-04-04" }), emptyDependent({ dateOfBirth: "2015-09-09" })],
      w2s: [typicalW2(50_000, 3_500), typicalW2(35_000, 2_500, { owner: "spouse" })],
    }),
  );
  const f = result.form1040;

  it("takes the child tax credit against tax", () => {
    // 85,000 - 31,500 = 53,500 -> 5,946 tax; 2 x 2,200 credit.
    assert.equal(f.taxableIncome, 53_500);
    assert.equal(f.tax, 5_946);
    assert.equal(f.childTaxCreditAndCreditForOtherDependents, 4_400);
    assert.equal(f.totalTax, 1_546);
    assert.equal(f.additionalChildTaxCredit, 0);
  });

  it("gets no EIC above the income limit", () => {
    assert.equal(f.earnedIncomeCredit, 0);
  });

  it("refunds the difference", () => {
    assert.equal(f.refund, 4_454);
  });
});

describe("head of household with a low income and one child", () => {
  const result = computeReturn(
    emptyReturn({
      filingStatus: "headOfHousehold",
      dependents: [emptyDependent({ dateOfBirth: "2022-01-10" })],
      w2s: [typicalW2(20_000, 800)],
    }),
  );
  const f = result.form1040;

  it("owes no tax", () => {
    assert.equal(f.standardDeduction, 23_625);
    assert.equal(f.taxableIncome, 0);
    assert.equal(f.totalTax, 0);
  });

  it("gets the refundable credits", () => {
    assert.equal(f.earnedIncomeCredit, 4_328);
    assert.equal(f.additionalChildTaxCredit, 1_700);
    assert.equal(f.refund, 800 + 4_328 + 1_700);
  });
});

describe("qualified dividends and capital gain distributions", () => {
  const result = computeReturn(
    emptyReturn({
      w2s: [typicalW2(40_000, 3_000)],
      form1099Divs: [
        empty1099Div({
          payerName: "Index Fund",
          ordinaryDividends: 4_000,
          qualifiedDividends: 3_000,
          capitalGainDistributions: 1_000,
        }),
      ],
    }),
  );

  it("taxes them at 0% within the bracket", () => {
    // Taxable income 29,250; 4,000 of it at 0%; ordinary tax on 25,250 = 2,795.
    assert.equal(result.form1040.taxableIncome, 29_250);
    assert.equal(result.qualifiedDividendsWorksheet?.lines[9], 4_000);
    assert.equal(result.form1040.tax, 2_795);
  });

  it("requires Schedule B over $1,500 of dividends", () => {
    assert.equal(result.scheduleB.required, true);
    assert.equal(result.complete, true);
  });
});

describe("dividends taxed at 15%", () => {
  it("applies the 15% rate above the 0% threshold", () => {
    const result = computeReturn(
      emptyReturn({
        w2s: [typicalW2(80_000, 10_000)],
        form1099Divs: [empty1099Div({ payerName: "Fund", ordinaryDividends: 10_000, qualifiedDividends: 10_000 })],
      }),
    );
    // Taxable income 74,250; ordinary part 64,250 (row midpoint 64,275):
    // 5,578.50 + 22% x 15,800 = 9,054.50 -> 9,055; dividends 10,000 x 15% = 1,500.
    assert.equal(result.form1040.taxableIncome, 74_250);
    assert.equal(result.form1040.tax, 10_555);
  });
});

describe("taxpayer age 65 or older", () => {
  it("gets the additional standard deduction and the senior deduction", () => {
    const result = computeReturn(
      emptyReturn({ taxpayer: emptyPerson({ dateOfBirth: "1955-03-03" }), w2s: [typicalW2(30_000, 1_000)] }),
    );
    const f = result.form1040;
    assert.equal(f.standardDeduction, 17_750);
    assert.equal(f.scheduleOneADeductions, 6_000);
    assert.equal(f.taxableIncome, 6_250);
    assert.equal(f.tax, 628);
  });

  it("phases out the senior deduction above $75,000", () => {
    const result = computeReturn(
      emptyReturn({ taxpayer: emptyPerson({ dateOfBirth: "1957-07-07" }), w2s: [typicalW2(100_000, 12_000)] }),
    );
    // 6,000 - 6% x 25,000 = 4,500
    assert.equal(result.form1040.scheduleOneADeductions, 4_500);
  });

  it("counts someone born January 2, 1961 as 65 only if born before January 2", () => {
    const born = (dateOfBirth: string) =>
      computeReturn(emptyReturn({ taxpayer: emptyPerson({ dateOfBirth }), w2s: [typicalW2(30_000, 0)] })).form1040
        .scheduleOneADeductions;
    assert.equal(born("1961-01-01"), 6_000);
    assert.equal(born("1961-01-02"), 0);
  });
});

describe("high-income couple", () => {
  const result = computeReturn(
    emptyReturn({
      filingStatus: "marriedFilingJointly",
      spouse: emptyPerson(),
      dependents: [emptyDependent({ dateOfBirth: "2018-01-01" }), emptyDependent({ dateOfBirth: "2019-01-01" })],
      w2s: [typicalW2(420_000, 80_000)],
    }),
  );
  const f = result.form1040;

  it("uses the rate schedule and phases out the child tax credit", () => {
    assert.equal(f.taxableIncome, 388_500);
    assert.equal(f.tax, 78_934);
    assert.equal(f.childTaxCreditAndCreditForOtherDependents, 3_400);
  });

  it("adds Additional Medicare Tax and credits the extra withholding", () => {
    // 0.9% x (420,000 - 250,000); the employer withheld 0.9% over 200,000.
    assert.equal(result.form8959.additionalMedicareTax, 1_530);
    assert.equal(result.form8959.additionalMedicareTaxWithheld, 1_980);
    assert.equal(f.totalTax, 78_934 - 3_400 + 1_530);
    assert.equal(f.federalWithholding, 81_980);
    assert.equal(f.refund, 81_980 - 77_064);
  });
});

describe("net investment income tax", () => {
  it("applies 3.8% to the smaller of investment income or MAGI over the threshold", () => {
    const result = computeReturn(
      emptyReturn({
        w2s: [typicalW2(190_000, 40_000)],
        form1099Ints: [empty1099Int({ payerName: "Bank", interest: 20_000 })],
      }),
    );
    // MAGI 210,000: min(20,000, 10,000) x 3.8% = 380
    assert.equal(result.form8960.netInvestmentIncomeTax, 380);
    assert.equal(result.form1040.otherTaxes, 380);
  });
});

describe("excess social security withholding", () => {
  it("credits withholding over the maximum across two employers", () => {
    const result = computeReturn(emptyReturn({ w2s: [typicalW2(120_000, 20_000), typicalW2(100_000, 15_000)] }));
    // 7,440 + 6,200 - 10,918.20 = 2,721.80
    assert.equal(result.form1040.excessSocialSecurityWithheld, 2_722);
  });
});

describe("cents", () => {
  it("adds amounts with cents before rounding", () => {
    const result = computeReturn(
      emptyReturn({
        form1099Ints: [
          empty1099Int({ payerName: "A", interest: 10.4 }),
          empty1099Int({ payerName: "B", interest: 10.4 }),
        ],
      }),
    );
    assert.equal(result.form1040.taxableInterest, 21);
  });
});

describe("diagnostics", () => {
  it("flags unsupported situations from screening", () => {
    const result = computeReturn(
      emptyReturn({ screening: { ...emptyScreening(), selfEmploymentOrGigIncome: true } }),
    );
    assert.equal(result.complete, false);
    assert.ok(result.diagnostics.some((d) => d.code === "screening.selfEmploymentOrGigIncome"));
  });

  it("requires a spouse on a joint return", () => {
    const result = computeReturn(emptyReturn({ filingStatus: "marriedFilingJointly" }));
    assert.ok(result.diagnostics.some((d) => d.code === "spouse.missing" && d.severity === "error"));
  });

  it("rejects negative amounts", () => {
    const result = computeReturn(emptyReturn({ w2s: [typicalW2(-5, 0)] }));
    assert.equal(result.complete, false);
  });

  it("rejects unsupported tax years", () => {
    assert.throws(() => computeReturn(emptyReturn({ taxYear: 2019 })), UnsupportedTaxYearError);
  });
});
