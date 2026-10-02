import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatMoneyInput, parseMoney, usd } from "../src/lib/money.ts";

describe("parseMoney", () => {
  it("accepts what people type", () => {
    assert.equal(parseMoney("1,234.56"), 1234.56);
    assert.equal(parseMoney("$1234"), 1234);
    assert.equal(parseMoney(" 12 "), 12);
    assert.equal(parseMoney(".5"), 0.5);
    assert.equal(parseMoney(""), 0);
  });
  it("rejects anything else", () => {
    assert.equal(parseMoney("-5"), null);
    assert.equal(parseMoney("1.234"), null);
    assert.equal(parseMoney("12a"), null);
    assert.equal(parseMoney("."), null);
  });
});

describe("formatting", () => {
  it("formats inputs and display amounts", () => {
    assert.equal(formatMoneyInput(1234.5), "1,234.50");
    assert.equal(formatMoneyInput(1234), "1,234");
    assert.equal(formatMoneyInput(0), "");
    assert.equal(usd(1234), "$1,234");
    assert.equal(usd(-50), "−$50");
  });
});
