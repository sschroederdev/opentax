import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyPerson, emptyReturn, validateInput } from "../src/index.ts";

describe("spouse information", () => {
  const spouse = emptyPerson({ firstName: "Sam", lastName: "Example" });
  const codes = (filingStatus: "single" | "marriedFilingSeparately") =>
    validateInput(emptyReturn({ filingStatus, spouse })).map((d) => d.code);

  it("is used on a separate return, where Form 1040 shows the spouse's name", () => {
    assert.ok(!codes("marriedFilingSeparately").includes("spouse.ignored"));
  });

  it("is ignored, with a warning, on an unmarried return", () => {
    assert.ok(codes("single").includes("spouse.ignored"));
  });
});
