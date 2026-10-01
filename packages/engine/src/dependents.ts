import { ageAtEndOfYear } from "./dates.ts";
import type { Dependent, DependentRelationship, Person } from "./types.ts";

const QUALIFYING_CHILD_RELATIONSHIPS: ReadonlySet<DependentRelationship> = new Set([
  "child",
  "stepchild",
  "fosterChild",
  "sibling",
  "stepsibling",
  "halfSibling",
  "descendantOfQualifyingRelative",
]);

/** The relationship and residency tests shared by the qualifying-child rules. */
function meetsRelationshipAndResidency(dependent: Dependent): boolean {
  return QUALIFYING_CHILD_RELATIONSHIPS.has(dependent.relationship) && dependent.monthsLivedWithFiler > 6;
}

/** Qualifying child for the child tax credit: under 17 at year end with a valid SSN. */
export function isCtcQualifyingChild(dependent: Dependent, year: number): boolean {
  return (
    meetsRelationshipAndResidency(dependent) &&
    dependent.hasValidSsn &&
    ageAtEndOfYear(dependent.dateOfBirth, year) < 17
  );
}

/**
 * Qualifying child for the earned income credit: under 19 (under 24 if a
 * full-time student) and younger than the filer (or spouse), or any age if
 * permanently disabled; lived with the filer in the US more than half the year.
 */
export function isEitcQualifyingChild(dependent: Dependent, filers: Person[], year: number): boolean {
  if (!meetsRelationshipAndResidency(dependent) || !dependent.hasValidSsn) return false;
  if (dependent.permanentlyDisabled) return true;
  const age = ageAtEndOfYear(dependent.dateOfBirth, year);
  const ageLimit = dependent.fullTimeStudent ? 24 : 19;
  const youngerThanAFiler = filers.some((f) => f.dateOfBirth < dependent.dateOfBirth);
  return age < ageLimit && youngerThanAFiler;
}
