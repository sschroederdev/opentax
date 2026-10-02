#!/usr/bin/env node
/**
 * Fills the official PDF forms for a return.
 *
 *   node packages/forms/src/cli.ts return.json [details.json] out.pdf
 *
 * details.json holds the FilerDetails (SSNs, address, and so on); without
 * it, those fields are left blank to fill in by hand.
 */
import { readFile, writeFile } from "node:fs/promises";
import { computeReturn, normalizeReturn } from "@opentax/engine";
import { buildPdf, emptyDetails, federalPacket, type FilerDetails } from "./index.ts";
import { loadPdfFromDisk } from "./node.ts";

const args = process.argv.slice(2);
if (args.length < 2 || args.length > 3) {
  console.error("Usage: node packages/forms/src/cli.ts return.json [details.json] out.pdf");
  process.exit(2);
}
const [returnPath, detailsPath, outPath] = args.length === 3 ? args : [args[0], undefined, args[1]];

const input = normalizeReturn(JSON.parse(await readFile(returnPath!, "utf8")));
const details: FilerDetails = detailsPath
  ? { ...emptyDetails(), ...(JSON.parse(await readFile(detailsPath, "utf8")) as Partial<FilerDetails>) }
  : emptyDetails();
const result = computeReturn(input);
const packet = federalPacket(input, result, details);
await writeFile(outPath!, await buildPdf(packet.forms, loadPdfFromDisk));

console.log(`Wrote ${outPath}:`);
for (const f of packet.forms) console.log(`  ${f.form.title}${f.label ? ` (${f.label})` : ""}`);
console.log("\nBefore mailing:");
for (const n of packet.notes) console.log(`  - ${n.form}: ${n.message}`);
for (const d of result.diagnostics.filter((d) => d.severity !== "info")) console.log(`  [${d.severity}] ${d.message}`);
