import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { regularTax, taxFromRateSchedule, TY2025 } from "../src/index.ts";
import { taxTableRow } from "../src/tax/regularTax.ts";

describe("tax table rows", () => {
  it("uses narrow rows at the bottom of the table", () => {
    assert.deepEqual(taxTableRow(0), [0, 5]);
    assert.deepEqual(taxTableRow(7), [5, 15]);
    assert.deepEqual(taxTableRow(24), [15, 25]);
    assert.deepEqual(taxTableRow(25), [25, 50]);
    assert.deepEqual(taxTableRow(2_999), [2_975, 3_000]);
  });

  it("uses $50 rows from $3,000", () => {
    assert.deepEqual(taxTableRow(3_000), [3_000, 3_050]);
    assert.deepEqual(taxTableRow(34_299), [34_250, 34_300]);
  });
});

describe("regular tax (2025)", () => {
  it("is zero for zero or negative income", () => {
    assert.equal(regularTax(0, "single", TY2025), 0);
    assert.equal(regularTax(-100, "single", TY2025), 0);
  });

  it("taxes the midpoint of the tax table row", () => {
    // Row 34,250-34,300, midpoint 34,275: 1,192.50 + 12% x 22,350 = 3,874.50
    assert.equal(regularTax(34_250, "single", TY2025), 3_875);
    assert.equal(regularTax(34_299, "single", TY2025), 3_875);
    // Row 20-25 ($15-$25), midpoint 20: $2
    assert.equal(regularTax(20, "single", TY2025), 2);
    // MFJ row 53,500-53,550, midpoint 53,525: 2,385 + 12% x 29,675 = 5,946
    assert.equal(regularTax(53_500, "marriedFilingJointly", TY2025), 5_946);
  });

  it("uses the rate schedule at $100,000 and above", () => {
    // 24% bracket: 134,250 x 24% - 7,153 = 25,067
    assert.equal(regularTax(134_250, "single", TY2025), 25_067);
    // 22% bracket: 100,000 x 22% - 5,086.50 = 16,913.50
    assert.equal(regularTax(100_000, "single", TY2025), 16_914);
  });

  it("matches published bracket boundaries", () => {
    // Tax at the top of each single bracket, from the 2025 rate schedule.
    assert.equal(taxFromRateSchedule(11_925, "single", TY2025), 1_193); // 1,192.50
    assert.equal(taxFromRateSchedule(48_475, "single", TY2025), 5_579); // 5,578.50
    assert.equal(taxFromRateSchedule(103_350, "single", TY2025), 17_651);
    assert.equal(taxFromRateSchedule(197_300, "single", TY2025), 40_199);
    assert.equal(taxFromRateSchedule(250_525, "single", TY2025), 57_231);
    assert.equal(taxFromRateSchedule(626_350, "single", TY2025), 188_770); // 188,769.75
  });

  it("uses the head of household schedule", () => {
    // 17,000 x 10% = 1,700; 64,850 -> 1,700 + 12% x 47,850 = 7,442
    assert.equal(taxFromRateSchedule(64_850, "headOfHousehold", TY2025), 7_442);
  });
});
