import { emptyReturn, normalizeReturn, type TaxReturnInput } from "@opentax/engine";
import { emptyDetails, emptyIdentity, type FilerDetails } from "@opentax/forms";

/** A return as the app keeps it: the engine input plus the details printed on the forms. */
export interface SavedReturn {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  input: TaxReturnInput;
  details: FilerDetails;
}

const FORMAT = "opentax-return";
const VERSION = 1;

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function newReturn(overrides: Partial<SavedReturn> = {}): SavedReturn {
  const now = new Date().toISOString();
  const input = overrides.input ?? emptyReturn();
  return {
    id: newId(),
    name: `${input.taxYear} return`,
    createdAt: now,
    updatedAt: now,
    input,
    details: emptyDetails(),
    ...overrides,
  };
}

/** The JSON file a return is exported as. It includes SSNs, so it should be kept private. */
export function exportReturn(saved: SavedReturn): string {
  const { id: _id, ...rest } = saved;
  return JSON.stringify({ format: FORMAT, version: VERSION, ...rest }, null, 2);
}

/** Fills in any missing details, so files from older versions still open. */
export function normalizeDetails(raw: Partial<FilerDetails> | undefined): FilerDetails {
  const base = emptyDetails();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    taxpayer: emptyIdentity(raw.taxpayer),
    spouse: emptyIdentity(raw.spouse),
    address: { ...base.address, ...raw.address },
    dependentSsns: Array.isArray(raw.dependentSsns) ? raw.dependentSsns.map(String) : [],
  };
}

/**
 * Reads an exported return, or a bare engine input (like the files in
 * examples/). Always gives the return a new id, so importing never
 * overwrites a return already saved.
 */
export function importReturn(text: string): SavedReturn {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON.");
  }
  if (!data || typeof data !== "object") throw new Error("This file doesn't contain a return.");
  const record = data as Record<string, unknown>;
  if (record.format === FORMAT) {
    if (typeof record.version !== "number" || record.version > VERSION) {
      throw new Error("This return was saved by a newer version of OpenTax.");
    }
    const input = normalizeReturn((record.input ?? {}) as Parameters<typeof normalizeReturn>[0]);
    return newReturn({
      name: typeof record.name === "string" && record.name ? record.name : `${input.taxYear} return`,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
      input,
      details: normalizeDetails(record.details as Partial<FilerDetails> | undefined),
    });
  }
  if ("taxYear" in record || "filingStatus" in record || "w2s" in record) {
    return newReturn({ input: normalizeReturn(record as Parameters<typeof normalizeReturn>[0]) });
  }
  throw new Error("This file doesn't look like an OpenTax return.");
}

/** A file name for an export: "2026-return-jordan-example.json". */
export function exportFileName(saved: SavedReturn): string {
  const who = `${saved.input.taxpayer.firstName} ${saved.input.taxpayer.lastName}`.trim();
  const slug = `${saved.input.taxYear} return ${who}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug}.json`;
}
