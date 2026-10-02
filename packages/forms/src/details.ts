/**
 * Details that appear on the forms but don't affect the tax: identifying
 * numbers, address, and a few yes/no questions. The engine never sees them.
 * They stay on the filer's device like the rest of the return.
 */
export interface FilerIdentity {
  middleInitial: string;
  /** Social security number or ITIN, digits with or without dashes. */
  ssn: string;
  occupation: string;
  /** Form 1040 page 1: a U.S. citizen, U.S. national, or alien lawfully authorized to work. */
  lawfullyAuthorizedToWork: boolean | null;
  /** $3 to the Presidential Election Campaign Fund. */
  presidentialCampaign: boolean;
}

export interface FilerDetails {
  taxpayer: FilerIdentity;
  spouse: FilerIdentity;
  /** SSNs of the dependents, in the same order as the return's dependents. */
  dependentSsns: string[];
  address: { street: string; apartment: string; city: string; state: string; zip: string };
  phone: string;
  email: string;
  /**
   * Form 1040 digital asset question: received digital assets as payment or
   * reward, or sold or exchanged them. null leaves it to the sales on the
   * return (yes if any 1099-DA sale, otherwise unanswered).
   */
  digitalAssets: boolean | null;
  directDeposit: { routingNumber: string; accountNumber: string; accountType: "checking" | "savings" } | null;
}

export const emptyIdentity = (overrides: Partial<FilerIdentity> = {}): FilerIdentity => ({
  middleInitial: "",
  ssn: "",
  occupation: "",
  lawfullyAuthorizedToWork: null,
  presidentialCampaign: false,
  ...overrides,
});

export const emptyDetails = (overrides: Partial<FilerDetails> = {}): FilerDetails => ({
  taxpayer: emptyIdentity(),
  spouse: emptyIdentity(),
  dependentSsns: [],
  address: { street: "", apartment: "", city: "", state: "", zip: "" },
  phone: "",
  email: "",
  digitalAssets: null,
  directDeposit: null,
  ...overrides,
});

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
