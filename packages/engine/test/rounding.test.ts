/**
 * Lines that add other rounded lines. The IRS instructions round each line
 * to whole dollars; a line that adds lines adds the rounded amounts.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeReturn, empty1099Int, emptyBusiness, emptyExpenses, emptyReturn, emptySale } from "../src/index.ts";

describe("Schedule B", () => {
  it("adds each payer's rounded interest when Schedule B is required", () => {
    // Exact total 800.40 + 800.40 = 1,600.80 > 1,500, so Schedule B is required.
    // Line 1 rows: 800 and 800; line 2 = 1,600 (not 1,601).
    const result = computeReturn(
      emptyReturn({
        form1099Ints: [empty1099Int({ payerName: "A", interest: 800.4 }), empty1099Int({ payerName: "B", interest: 800.4 })],
      }),
    );
    assert.equal(result.scheduleB.required, true);
    assert.deepEqual(result.scheduleB.interest.map((r) => r.amount), [800, 800]);
    assert.equal(result.form1040.taxableInterest, 1_600);
  });

  it("rounds the total when Schedule B isn't required", () => {
    // 400.40 + 400.40 = 800.80 -> 801.
    const result = computeReturn(
      emptyReturn({
        form1099Ints: [empty1099Int({ payerName: "A", interest: 400.4 }), empty1099Int({ payerName: "B", interest: 400.4 })],
      }),
    );
    assert.equal(result.scheduleB.required, false);
    assert.equal(result.form1040.taxableInterest, 801);
  });
});

describe("Schedule C line 28", () => {
  it("adds the rounded expense lines", () => {
    // Line 8 advertising 100.40 -> 100; line 22 supplies 100.40 -> 100;
    // line 24b meals 50% x 101 = 50.50 -> 51. Line 28 = 100 + 100 + 51 = 251.
    const result = computeReturn(
      emptyReturn({
        businesses: [
          emptyBusiness({
            otherGrossReceipts: 5_000,
            expenses: emptyExpenses({ advertising: 100.4, supplies: 100.4, meals: 101 }),
          }),
        ],
      }),
    );
    assert.equal(result.scheduleC[0]!.totalExpenses, 251);
  });
});

describe("Form 8949 totals", () => {
  it("add the rounded rows", () => {
    // Two short-term sales, proceeds 100.40 and basis 50.30 each.
    // Rows: (d) 100, (e) 50, (h) 50. Line 2: (d) 200, (e) 100, (h) 100 (not 201 / 101).
    const sale = emptySale({ description: "X", dateAcquired: "2026-01-05", dateSold: "2026-03-05", proceeds: 100.4, costBasis: 50.3 });
    const result = computeReturn(emptyReturn({ capitalAssetSales: [sale, sale] }));
    const group = result.scheduleD!.form8949[0]!;
    assert.equal(group.proceeds, 200);
    assert.equal(group.costBasis, 100);
    assert.equal(group.gainOrLoss, 100);
    assert.equal(result.scheduleD!.netShortTerm, 100);
  });
});
