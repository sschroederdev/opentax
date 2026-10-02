/**
 * Fills whole returns and checks the forms against each other: each
 * schedule's total equals the Form 1040 line it feeds, and Form 1040's own
 * arithmetic holds. One return also has hand-computed expected values.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import {
  computeReturn,
  empty1099Div,
  empty1099Int,
  emptyBusiness,
  emptyBusinessIncomeForm,
  emptyDependent,
  emptyPerson,
  emptyReturn,
  emptySale,
  normalizeReturn,
  typicalW2,
  type TaxReturnInput,
} from "@opentax/engine";
import { PDFDocument } from "pdf-lib";
import { buildPdf, emptyDetails, emptyIdentity, federalPacket, fillPdf, type FederalPacket } from "../src/index.ts";
import { loadPdfFromDisk } from "../src/node.ts";

const details = emptyDetails({
  taxpayer: emptyIdentity({ ssn: "900-00-1001", occupation: "Server", lawfullyAuthorizedToWork: true }),
  spouse: emptyIdentity({ ssn: "900-00-1002", occupation: "Nurse", lawfullyAuthorizedToWork: true }),
  dependentSsns: ["900-00-2001", "900-00-2002", "900-00-2003"],
  address: { street: "100 Example Ave", apartment: "", city: "Springfield", state: "IL", zip: "62701" },
  digitalAssets: false,
});

function packetFor(input: TaxReturnInput): FederalPacket {
  return federalPacket(input, computeReturn(input), details);
}

/** Parses a filled amount: "1,234" -> 1234, "(1,234)" -> -1234, missing -> 0. */
function value(packet: FederalPacket, formId: string, key: string, copy = 0): number {
  const forms = packet.forms.filter((f) => f.form.id === formId);
  const raw = forms[copy]?.values[key];
  if (raw === undefined || raw === "") return 0;
  assert.equal(typeof raw, "string", `${formId} ${key} is a checkbox`);
  const text = raw as string;
  const negative = text.startsWith("(");
  const n = Number(text.replace(/[(),]/g, ""));
  assert.ok(Number.isFinite(n), `${formId} ${key}: "${text}" is not an amount`);
  return negative ? -n : n;
}

const sumCopies = (packet: FederalPacket, formId: string, key: string) =>
  packet.forms.filter((f) => f.form.id === formId).reduce((sum, _f, i) => sum + value(packet, formId, key, i), 0);

const has = (packet: FederalPacket, formId: string) => packet.forms.some((f) => f.form.id === formId);

/** Form 1040's arithmetic and every schedule-to-1040 carry. */
function checkConsistency(p: FederalPacket) {
  const v = (key: string) => value(p, "f1040", key);
  assert.equal(v("9"), v("1z") + v("2b") + v("3b") + v("7a") + v("8"), "1040 line 9");
  assert.equal(v("11a"), v("9") - v("10"), "1040 line 11a");
  assert.equal(v("11b"), v("11a"), "1040 line 11b");
  assert.equal(v("14"), v("12e") + v("12f") + v("13a") + v("13b"), "1040 line 14");
  assert.equal(v("15"), Math.max(0, v("11b") - v("14")), "1040 line 15");
  assert.equal(v("18"), v("16") + v("17"), "1040 line 18");
  assert.equal(v("21"), v("19") + v("20"), "1040 line 21");
  assert.equal(v("22"), Math.max(0, v("18") - v("21")), "1040 line 22");
  assert.equal(v("24a"), v("22") + v("23"), "1040 line 24a");
  assert.equal(v("25d"), v("25a") + v("25b") + v("25c"), "1040 line 25d");
  assert.equal(v("32a"), v("27a") + v("28") + v("31"), "1040 line 32a");
  assert.equal(v("32c"), v("32a") - v("32b"), "1040 line 32c");
  assert.equal(v("33"), v("25d") + v("26") + v("32c"), "1040 line 33");
  assert.equal(v("34"), Math.max(0, v("33") - v("24c")), "1040 line 34");
  assert.equal(v("37"), Math.max(0, v("24c") - v("33")), "1040 line 37");

  assert.equal(value(p, "f1040s1", "10"), v("8"), "Schedule 1 line 10 -> 1040 line 8");
  assert.equal(value(p, "f1040s1", "26"), v("10"), "Schedule 1 line 26 -> 1040 line 10");
  assert.equal(value(p, "f1040s1", "3"), sumCopies(p, "f1040sc", "31"), "Schedule C line 31 -> Schedule 1 line 3");
  assert.equal(value(p, "f1040s1", "15"), sumCopies(p, "f1040sse", "13"), "Schedule SE line 13 -> Schedule 1 line 15");
  assert.equal(value(p, "f1040s1a", "44"), v("13a"), "Schedule 1-A line 44 -> 1040 line 13a");
  assert.equal(value(p, "f1040s2", "21"), v("23"), "Schedule 2 line 21 -> 1040 line 23");
  assert.equal(value(p, "f1040s2", "4"), sumCopies(p, "f1040sse", "12"), "Schedule SE line 12 -> Schedule 2 line 4");
  assert.equal(value(p, "f1040s2", "6"), value(p, "f8960", "17"), "Form 8960 line 17 -> Schedule 2 line 6");
  assert.equal(value(p, "f1040s2", "11"), value(p, "f8959", "18"), "Form 8959 line 18 -> Schedule 2 line 11");
  assert.equal(value(p, "f1040s2", "17b"), value(p, "f8959", "7"), "Form 8959 line 7 -> Schedule 2 line 17b");
  assert.equal(v("25c"), value(p, "f8959", "24"), "Form 8959 line 24 -> 1040 line 25c");
  assert.equal(value(p, "f1040s3", "15"), v("31"), "Schedule 3 line 15 -> 1040 line 31");
  assert.equal(value(p, "f1040s3a", "8"), v("32b"), "Schedule 3-A line 8 -> 1040 line 32b");
  assert.equal(value(p, "f1040s8", "14"), v("19"), "Schedule 8812 line 14 -> 1040 line 19");
  assert.equal(value(p, "f1040s8", "27"), v("28"), "Schedule 8812 line 27 -> 1040 line 28");
  assert.equal(value(p, "f8995", "17"), v("13b"), "Form 8995 line 17 -> 1040 line 13b");
  if (has(p, "f1040sb")) {
    assert.equal(value(p, "f1040sb", "4"), v("2b"), "Schedule B line 4 -> 1040 line 2b");
    assert.equal(value(p, "f1040sb", "6"), v("3b"), "Schedule B line 6 -> 1040 line 3b");
    const rows = (line: string) =>
      Object.keys(p.forms.find((f) => f.form.id === "f1040sb")!.values)
        .filter((k) => k.startsWith(`${line}.`) && k.endsWith(".amount"))
        .reduce((sum, k) => sum + value(p, "f1040sb", k), 0);
    assert.equal(rows("1"), value(p, "f1040sb", "2"), "Schedule B line 2 adds line 1");
    assert.equal(rows("5"), value(p, "f1040sb", "6"), "Schedule B line 6 adds line 5");
  }
  if (has(p, "f1040sd")) {
    const d = (key: string) => value(p, "f1040sd", key);
    const line7a = d("16") < 0 ? -d("21") : d("16");
    assert.equal(line7a, v("7a"), "Schedule D -> 1040 line 7a");
    assert.equal(d("7"), d("1b.h") + d("2.h") + d("3.h") - d("6"), "Schedule D line 7");
    assert.equal(d("15"), d("8b.h") + d("9.h") + d("10.h") + d("13") - d("14"), "Schedule D line 15");
    const totals = (part: string, col: string) => sumCopies(p, "f8949", `${part}.total.${col}`);
    assert.equal(totals("p1", "h"), d("1b.h") + d("2.h") + d("3.h"), "Form 8949 Part I totals -> Schedule D");
    assert.equal(totals("p2", "h"), d("8b.h") + d("9.h") + d("10.h"), "Form 8949 Part II totals -> Schedule D");
  }
}

/** Fills every form into its PDF, which fails on a text value for a checkbox (or the reverse). */
async function fillAll(p: FederalPacket) {
  for (const filled of p.forms) await fillPdf(await loadPdfFromDisk(filled.form), filled);
}

const example = normalizeReturn(
  JSON.parse(await readFile(new URL("../../../examples/2026-illinois-server-freelancer.json", import.meta.url), "utf8")),
);

const returns: Record<string, TaxReturnInput> = {
  "server and freelancer (the 2026 example)": example,
  "single parent, no citizenship (Schedule 3-A)": emptyReturn({
    filingStatus: "headOfHousehold",
    taxpayer: emptyPerson({ firstName: "Pat", lastName: "Example" }),
    dependents: [emptyDependent({ firstName: "Kid", lastName: "Example" })],
    w2s: [typicalW2(22_000, 0)],
    citizenNationalOrQualifiedAlien: false,
  }),
  "high earners with investments": emptyReturn({
    filingStatus: "marriedFilingJointly",
    taxpayer: emptyPerson({ firstName: "Alex", lastName: "Example" }),
    spouse: emptyPerson({ firstName: "Sam", lastName: "Example", dateOfBirth: "1958-03-01" }),
    dependents: [emptyDependent({ firstName: "A" }), emptyDependent({ firstName: "B" }), emptyDependent({ firstName: "C", dateOfBirth: "2005-02-01", fullTimeStudent: true })],
    w2s: [typicalW2(240_000, 40_000), typicalW2(110_000, 15_000, { owner: "spouse" }), typicalW2(90_000, 9_000, { owner: "spouse" })],
    form1099Ints: [empty1099Int({ payerName: "Bank", interest: 1_200.4 }), empty1099Int({ payerName: "Treasury", usSavingsBondAndTreasuryInterest: 900.4 })],
    form1099Divs: [empty1099Div({ payerName: "Fund", ordinaryDividends: 6_000, qualifiedDividends: 5_000, capitalGainDistributions: 700 })],
    capitalAssetSales: [
      ...Array.from({ length: 13 }, (_, i) =>
        emptySale({ description: `${i + 1} sh. XYZ`, dateAcquired: "2026-01-02", dateSold: "2026-02-03", proceeds: 1_000.5, costBasis: 900.25 }),
      ),
      emptySale({ description: "BTC", assetType: "digitalAsset", term: "long", dateAcquired: "2020-01-01", dateSold: "2026-05-01", proceeds: 20_000, costBasis: 5_000 }),
      emptySale({ description: "ABC", term: "long", basisReportedToIrs: false, dateAcquired: "2019-01-01", dateSold: "2026-05-01", proceeds: 3_000, costBasis: 4_000, washSaleLossDisallowed: 0 }),
    ],
    capitalLossCarryover: { shortTerm: 500, longTerm: 250 },
    estimatedTaxPayments: 4_000,
  }),
  "two businesses with a loss": emptyReturn({
    w2s: [typicalW2(48_000, 4_000, { qualifiedOvertimeCompensation: 3_000, employerEin: "12-3456789" })],
    businesses: [
      emptyBusiness({ name: "Consulting", incomeForms: [emptyBusinessIncomeForm({ amount: 30_000, federalWithholding: 500 })], homeOfficeSquareFeet: 150 }),
      emptyBusiness({ name: "Crafts", otherGrossReceipts: 800, expenses: { ...emptyBusiness().expenses, supplies: 1_400, other: 120 } }),
    ],
    charitableCashContributions: 400,
  }),
};

describe("federal packets", () => {
  for (const [name, input] of Object.entries(returns)) {
    describe(name, () => {
      const packet = packetFor(input);
      it("is internally consistent", () => checkConsistency(packet));
      it("fills every PDF", async () => fillAll(packet));
    });
  }

  it("includes the schedules each return needs", () => {
    const ids = (input: TaxReturnInput) => packetFor(input).forms.map((f) => f.form.id);
    assert.deepEqual(ids(returns["single parent, no citizenship (Schedule 3-A)"]!), ["f1040", "f1040s3a", "f1040sei", "f1040s8"]);
    // The spouse is over 65, but the senior deduction phases out completely
    // at this income (6,000 - 6% x (MAGI - 150,000) < 0), so no Schedule 1-A.
    assert.deepEqual(ids(returns["high earners with investments"]!), [
      "f1040", "f1040s2", "f1040s3", "f1040sb", "f1040sd", "f8949", "f8949", "f1040s8", "f8959", "f8960",
    ]);
  });

  it("fills hand-computed values for the Schedule 3-A return", () => {
    // HOH, one child, wages 22,000: tax 0, EIC 4,427, ACTC 1,700 (worked in the
    // engine's scheduleThreeA tests). Not a citizen, national, or qualified
    // alien, so all 6,127 is withheld on line 32b.
    const p = packetFor(returns["single parent, no citizenship (Schedule 3-A)"]!);
    const v = (key: string) => value(p, "f1040", key);
    assert.equal(v("1a"), 22_000);
    assert.equal(v("12e"), 24_150);
    assert.equal(v("15"), 0);
    assert.equal(v("27a"), 4_427);
    assert.equal(v("28"), 1_700);
    assert.equal(v("32a"), 6_127);
    assert.equal(v("32b"), 6_127);
    assert.equal(v("33"), 0);
    const threeA = p.forms.find((f) => f.form.id === "f1040s3a")!.values;
    assert.equal(threeA["6_yes"], true);
    assert.equal(threeA["8_no"], true);
    const f1040 = p.forms[0]!.values;
    assert.equal(f1040["status.hoh"], true);
    assert.equal(f1040["dep1.ctc"], true);
    assert.equal(f1040["dep1.ssn"], "900-00-2001");
  });

  it("splits long-term and short-term sales across Form 8949 copies by box", () => {
    // 13 short-term box A sales: 11 on copy 1, 2 on copy 2. Long-term: box E
    // (ABC) and box J (BTC), one per copy.
    const p = packetFor(returns["high earners with investments"]!);
    const copies = p.forms.filter((f) => f.form.id === "f8949").map((f) => f.values);
    assert.equal(copies[0]!["p1.boxA"], true);
    assert.equal(copies[0]!["p1.r11.a"], "11 sh. XYZ");
    assert.equal(copies[1]!["p1.r2.a"], "13 sh. XYZ");
    assert.equal(copies[1]!["p1.r3.a"], undefined);
    assert.equal(copies[0]!["p2.boxE"], true);
    assert.equal(copies[1]!["p2.boxJ"], true);
    // Each row: 1,000.50 -> 1,001 and 900.25 -> 900, gain 101; copy 1 total 11 x 101.
    assert.equal(copies[0]!["p1.r1.h"], "101");
    assert.equal(copies[0]!["p1.total.h"], "1,111");
  });

  it("builds one PDF with the draft cover pages removed", async () => {
    const p = packetFor(example);
    const bytes = await buildPdf(p.forms, loadPdfFromDisk);
    const doc = await PDFDocument.load(bytes);
    const blankPages = await Promise.all(
      p.forms.map(async (f) => (await PDFDocument.load(await loadPdfFromDisk(f.form))).getPageCount() - f.form.coverPages),
    );
    assert.equal(doc.getPageCount(), blankPages.reduce((a, b) => a + b, 0));
    assert.equal(doc.getForm().getFields().length, 0, "flattened");
  });

  it("lists what to do by hand", () => {
    const notes = packetFor(example).notes.map((n) => `${n.form}: ${n.message}`);
    assert.ok(notes.some((n) => n.startsWith("Schedule C (Photography)")));
    assert.ok(notes.some((n) => n.includes("DRAFT")));
  });

  it("refuses tax years without forms", () => {
    const input = emptyReturn({ taxYear: 2025 });
    assert.throws(() => federalPacket(input, computeReturn(input), details), /2026 only/);
  });
});
