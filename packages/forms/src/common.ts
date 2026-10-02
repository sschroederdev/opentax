import type { DependentRelationship } from "@opentax/engine";
import type { FormContext } from "./types.ts";
import { ssn } from "./format.ts";

const fullName = (first: string, middleInitial: string, last: string) =>
  [first, middleInitial, last].filter((part) => part.trim()).join(" ");

/** "Name(s) shown on return" for schedules: both spouses on a joint return. */
export function namesOnReturn({ input, details }: FormContext): string {
  const you = fullName(input.taxpayer.firstName, details.taxpayer.middleInitial, input.taxpayer.lastName);
  if (input.filingStatus !== "marriedFilingJointly" || !input.spouse) return you;
  const spouse = fullName(input.spouse.firstName, details.spouse.middleInitial, input.spouse.lastName);
  return input.spouse.lastName === input.taxpayer.lastName
    ? `${fullName(input.taxpayer.firstName, details.taxpayer.middleInitial, "")} & ${fullName(input.spouse.firstName, details.spouse.middleInitial, input.spouse.lastName)}`
    : `${you} & ${spouse}`;
}

/** The SSN shown first on Form 1040, which goes on every schedule. */
export const primarySsn = ({ details }: FormContext) => ssn(details.taxpayer.ssn);

/** Name and SSN of the taxpayer or spouse, for forms filed per person (Schedules C and SE). */
export function personHeader({ input, details }: FormContext, owner: "taxpayer" | "spouse") {
  const person = owner === "spouse" && input.spouse ? input.spouse : input.taxpayer;
  const identity = owner === "spouse" ? details.spouse : details.taxpayer;
  return { name: fullName(person.firstName, identity.middleInitial, person.lastName), ssn: ssn(identity.ssn) };
}

/** Born before January 2 of the year 64 years before the tax year: age 65 by year end (1040 line 12d). */
export const bornBeforeAge65Cutoff = (dateOfBirth: string, year: number) => dateOfBirth < `${year - 64}-01-02`;

/** Relationship words for the dependents section and Schedule EIC. */
export const RELATIONSHIP_LABELS: Record<DependentRelationship, string> = {
  child: "Child",
  stepchild: "Stepchild",
  fosterChild: "Foster child",
  sibling: "Sibling",
  stepsibling: "Stepsibling",
  halfSibling: "Half sibling",
  descendantOfQualifyingRelative: "Grandchild/niece/nephew",
  parent: "Parent",
  other: "Other relative",
};
