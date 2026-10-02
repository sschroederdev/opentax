import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeReturn, normalizeReturn } from "../src/index.ts";

describe("normalizeReturn", () => {
  it("fills missing fields so partial JSON can be computed", () => {
    const input = normalizeReturn({
      taxYear: 2026,
      w2s: [{ wages: 50_000, federalWithholding: 5_000 }],
      businesses: [{ otherGrossReceipts: 1_000, expenses: { supplies: 100 } }],
      illinois: { residency: "fullYear" },
    });
    assert.equal(input.w2s[0]!.qualifiedTips, 0);
    assert.equal(input.businesses[0]!.expenses.meals, 0);
    assert.equal(input.illinois!.useTax, 0);
    const result = computeReturn(input);
    assert.equal(result.form1040.wages, 50_000);
    assert.equal(result.scheduleC[0]!.netProfit, 900);
  });
});
