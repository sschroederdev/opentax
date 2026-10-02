import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { emptyW2 } from "@opentax/engine";
import { exportFileName, exportReturn, importReturn, newReturn } from "../src/lib/savedReturn.ts";

describe("export and import", () => {
  it("round-trips a return with its details, under a new id", () => {
    const saved = newReturn({ name: "Mine" });
    saved.input.taxpayer.firstName = "Jordan";
    saved.input.w2s.push(emptyW2({ employerName: "Bistro", wages: 1_000.5 }));
    saved.details.taxpayer.ssn = "900-00-0001";
    const copy = importReturn(exportReturn(saved));
    assert.notEqual(copy.id, saved.id);
    assert.equal(copy.name, "Mine");
    assert.deepEqual(copy.input, saved.input);
    assert.deepEqual(copy.details, saved.details);
  });

  it("opens a bare engine input, like the examples", async () => {
    const text = await readFile(new URL("../../../examples/2026-illinois-server-freelancer.json", import.meta.url), "utf8");
    const saved = importReturn(text);
    assert.equal(saved.input.taxYear, 2026);
    assert.equal(saved.input.taxpayer.firstName, "Jordan");
    assert.equal(saved.details.taxpayer.ssn, "");
    assert.equal(exportFileName(saved), "2026-return-jordan-example.json");
  });

  it("fills in details missing from an older file", () => {
    const text = JSON.stringify({ format: "opentax-return", version: 1, name: "Old", input: {}, details: { taxpayer: { ssn: "900-00-0002" } } });
    const saved = importReturn(text);
    assert.equal(saved.details.taxpayer.ssn, "900-00-0002");
    assert.equal(saved.details.taxpayer.lawfullyAuthorizedToWork, null);
    assert.equal(saved.details.address.city, "");
  });

  it("explains files it can't open", () => {
    assert.throws(() => importReturn("not json"), /valid JSON/);
    assert.throws(() => importReturn("[1, 2]"), /OpenTax return/);
    assert.throws(() => importReturn(JSON.stringify({ format: "opentax-return", version: 99 })), /newer version/);
  });
});
