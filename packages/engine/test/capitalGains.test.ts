/**
 * Stock and crypto sales (Form 8949, Schedule D) for 2026. Expected values
 * are worked by hand; comments show the arithmetic.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeReturn, emptyReturn, emptySale, typicalW2 } from "../src/index.ts";
import { form8949Box } from "../src/income/capitalGains.ts";

describe("Form 8949 boxes", () => {
  it("chooses the box from term, form, and basis reporting", () => {
    assert.equal(form8949Box(emptySale({ term: "short" })), "A");
    assert.equal(form8949Box(emptySale({ term: "short", basisReportedToIrs: false })), "B");
    assert.equal(form8949Box(emptySale({ term: "short", reportedOnForm: false })), "C");
    assert.equal(form8949Box(emptySale({ term: "long" })), "D");
    assert.equal(form8949Box(emptySale({ term: "long", reportedOnForm: false })), "F");
    assert.equal(form8949Box(emptySale({ term: "short", assetType: "digitalAsset" })), "G");
    assert.equal(form8949Box(emptySale({ term: "long", assetType: "digitalAsset", basisReportedToIrs: false })), "K");
  });
});

describe("gains with a wash sale", () => {
  const result = computeReturn(
    emptyReturn({
      w2s: [typicalW2(60_000, 7_000)],
      capitalAssetSales: [
        emptySale({ description: "10 sh AAA", proceeds: 5_000, costBasis: 3_000 }),
        emptySale({ description: "20 sh BBB", term: "long", dateAcquired: "2020-01-01", proceeds: 10_000, costBasis: 4_000 }),
        emptySale({
          description: "5 sh CCC",
          basisReportedToIrs: false,
          proceeds: 1_000,
          costBasis: 2_000,
          washSaleLossDisallowed: 400,
        }),
      ],
    }),
  );
  const d = result.scheduleD!;

  it("nets short- and long-term results", () => {
    // Short: +2,000 and (1,000 - 2,000 + 400) = -600 -> 1,400. Long: +6,000.
    assert.equal(d.netShortTerm, 1_400);
    assert.equal(d.netLongTerm, 6_000);
    assert.equal(d.total, 7_400);
    assert.equal(result.form1040.capitalGainOrLoss, 7_400);
  });

  it("records the wash sale adjustment with code W", () => {
    const boxB = d.form8949.find((g) => g.box === "B")!;
    assert.equal(boxB.rows[0]!.adjustmentCode, "W");
    assert.equal(boxB.gainOrLoss, -600);
  });

  it("taxes the long-term gain at capital gain rates", () => {
    // TI = 67,400 - 16,100 = 51,300. Worksheet: line 3 = min(6,000, 7,400).
    // Line 5 = 45,300; line 9 = 49,450 - 45,300 = 4,150 at 0%; line 17 = 1,850 at
    // 15% = 277.50; tax on 45,300 (midpoint 45,325) = 1,240 + 12% x 32,925 = 5,191.
    // 5,468.50 vs. regular tax on 51,300 (6,004) -> 5,469.
    const ws = result.qualifiedDividendsWorksheet!;
    assert.equal(result.form1040.taxableIncome, 51_300);
    assert.equal(ws.lines[3], 6_000);
    assert.equal(ws.lines[9], 4_150);
    assert.equal(ws.lines[18], 277.5);
    assert.equal(ws.lines[22], 5_191);
    assert.equal(ws.lines[24], 6_004);
    assert.equal(result.form1040.tax, 5_469);
  });
});

describe("capital losses", () => {
  const result = computeReturn(
    emptyReturn({
      w2s: [typicalW2(50_000, 6_000)],
      capitalAssetSales: [
        emptySale({ proceeds: 2_000, costBasis: 10_000 }),
        emptySale({ term: "long", proceeds: 3_000, costBasis: 2_000 }),
      ],
    }),
  );
  const d = result.scheduleD!;

  it("limits the deduction to $3,000", () => {
    assert.equal(d.total, -7_000);
    assert.equal(d.allowedLoss, -3_000);
    assert.equal(result.form1040.adjustedGrossIncome, 47_000);
  });

  it("uses regular tax when Schedule D is a net loss", () => {
    // TI 30,900, midpoint 30,925: 1,240 + 12% x 18,525 = 3,463
    assert.equal(result.qualifiedDividendsWorksheet, null);
    assert.equal(result.form1040.tax, 3_463);
  });

  it("carries the unused short-term loss forward", () => {
    // Worksheet: line 4 = 3,000; line 5 = 8,000; line 6 = 1,000; line 8 = 8,000 - 4,000.
    assert.deepEqual(d.carryoverToNextYear, { shortTerm: 4_000, longTerm: 0 });
  });

  it("uses a carryover from last year", () => {
    const next = computeReturn(
      emptyReturn({ w2s: [typicalW2(50_000, 6_000)], capitalLossCarryover: { shortTerm: 4_000, longTerm: 0 } }),
    );
    assert.equal(next.form1040.capitalGainOrLoss, -3_000);
    assert.deepEqual(next.scheduleD!.carryoverToNextYear, { shortTerm: 1_000, longTerm: 0 });
  });

  it("allows only $1,500 married filing separately", () => {
    const mfs = computeReturn(
      emptyReturn({
        filingStatus: "marriedFilingSeparately",
        w2s: [typicalW2(50_000, 6_000)],
        capitalAssetSales: [emptySale({ proceeds: 0, costBasis: 5_000 })],
      }),
    );
    assert.equal(mfs.form1040.capitalGainOrLoss, -1_500);
  });
});

describe("unsupported capital gain situations", () => {
  it("flags collectibles gains", () => {
    const result = computeReturn(
      emptyReturn({
        w2s: [typicalW2(50_000, 6_000)],
        capitalAssetSales: [emptySale({ term: "long", collectible: true, proceeds: 5_000, costBasis: 1_000 })],
      }),
    );
    assert.ok(result.diagnostics.some((d) => d.code === "scheduleD.taxWorksheet"));
    assert.equal(result.complete, false);
  });

  it("rejects a sale dated outside the tax year", () => {
    const result = computeReturn(emptyReturn({ capitalAssetSales: [emptySale({ dateSold: "2025-12-31" })] }));
    assert.ok(result.diagnostics.some((d) => d.code === "sale.year"));
  });
});
