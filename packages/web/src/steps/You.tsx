import { emptyPerson, type FilingStatus, type Person } from "@opentax/engine";
import type { FilerIdentity } from "@opentax/forms";
import { Checkbox, DateInput, TextInput, YesNo } from "../components/fields.tsx";
import type { StepProps } from "./types.ts";

const STATUSES: [FilingStatus, string, string][] = [
  ["single", "Single", "Unmarried, divorced, or legally separated on December 31."],
  ["marriedFilingJointly", "Married filing jointly", "Married on December 31 and filing one return together."],
  ["marriedFilingSeparately", "Married filing separately", "Married, each filing your own return."],
  ["headOfHousehold", "Head of household", "Unmarried and paid more than half the cost of a home for a qualifying person."],
  ["qualifyingSurvivingSpouse", "Qualifying surviving spouse", "Spouse died in 2024 or 2025 and you have a dependent child."],
];

function PersonFields(props: {
  who: "you" | "spouse";
  person: Person;
  identity: FilerIdentity;
  onPerson: (change: Partial<Person>) => void;
  onIdentity: (change: Partial<FilerIdentity>) => void;
}) {
  const { person, identity } = props;
  const you = props.who === "you";
  return (
    <>
      <div className="grid">
        <TextInput label="First name" value={person.firstName} onChange={(firstName) => props.onPerson({ firstName })} />
        <TextInput
          label="Middle initial"
          value={identity.middleInitial}
          maxLength={1}
          onChange={(middleInitial) => props.onIdentity({ middleInitial })}
        />
        <TextInput label="Last name" value={person.lastName} onChange={(lastName) => props.onPerson({ lastName })} />
        <DateInput label="Date of birth" value={person.dateOfBirth} onChange={(dateOfBirth) => props.onPerson({ dateOfBirth })} />
        <TextInput
          label="Social security number"
          hint="Printed on the forms only."
          value={identity.ssn}
          placeholder="123-45-6789"
          onChange={(ssn) => props.onIdentity({ ssn })}
        />
        <TextInput label="Occupation" value={identity.occupation} onChange={(occupation) => props.onIdentity({ occupation })} />
      </div>
      <Checkbox
        label={you ? "I have a social security number that is valid for employment" : "My spouse has a social security number that is valid for employment"}
        hint="Not an ITIN, and not a card that says it isn't valid for employment. Needed for several credits and deductions."
        checked={person.hasValidSsn}
        onChange={(hasValidSsn) => props.onPerson({ hasValidSsn })}
      />
      <Checkbox label={you ? "I am blind" : "My spouse is blind"} checked={person.blind} onChange={(blind) => props.onPerson({ blind })} />
      <Checkbox
        label={you ? "Someone else can claim me as a dependent" : "Someone else can claim my spouse as a dependent"}
        checked={person.canBeClaimedAsDependent}
        onChange={(canBeClaimedAsDependent) => props.onPerson({ canBeClaimedAsDependent })}
      />
      <YesNo
        label={you ? "Are you a U.S. citizen, U.S. national, or an alien lawfully authorized to work in the U.S.?" : "Is your spouse a U.S. citizen, U.S. national, or an alien lawfully authorized to work in the U.S.?"}
        hint="Asked on page 1 of the 2026 Form 1040."
        value={identity.lawfullyAuthorizedToWork}
        onChange={(lawfullyAuthorizedToWork) => props.onIdentity({ lawfullyAuthorizedToWork })}
      />
      <Checkbox
        label={you ? "Send $3 to the Presidential Election Campaign Fund" : "My spouse wants $3 to go to the Presidential Election Campaign Fund"}
        hint="This doesn't change your tax or refund."
        checked={identity.presidentialCampaign}
        onChange={(presidentialCampaign) => props.onIdentity({ presidentialCampaign })}
      />
    </>
  );
}

export function You({ saved, update }: StepProps) {
  const { input, details } = saved;
  const status = input.filingStatus;
  const married = status === "marriedFilingJointly" || status === "marriedFilingSeparately";
  const spouse = input.spouse ?? emptyPerson();
  return (
    <>
      <h2>About you</h2>
      <fieldset className="choices">
        <legend>Filing status</legend>
        {STATUSES.map(([value, label, description]) => (
          <label key={value} className={status === value ? "choice selected" : "choice"}>
            <input
              type="radio"
              name="filingStatus"
              checked={status === value}
              onChange={() =>
                update((d) => {
                  d.input.filingStatus = value;
                  if ((value === "marriedFilingJointly" || value === "marriedFilingSeparately") && !d.input.spouse) {
                    d.input.spouse = emptyPerson({ firstName: "", lastName: d.input.taxpayer.lastName });
                  }
                })
              }
            />
            <span>
              <strong>{label}</strong>
              <span className="hint">{description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <h3>You</h3>
      <PersonFields
        who="you"
        person={input.taxpayer}
        identity={details.taxpayer}
        onPerson={(change) => update((d) => Object.assign(d.input.taxpayer, change))}
        onIdentity={(change) => update((d) => Object.assign(d.details.taxpayer, change))}
      />

      {married && (
        <>
          <h3>Your spouse</h3>
          {status === "marriedFilingSeparately" ? (
            <div className="grid">
              <TextInput
                label="Spouse's first name"
                value={spouse.firstName}
                onChange={(firstName) => update((d) => void (d.input.spouse = { ...spouse, firstName }))}
              />
              <TextInput
                label="Spouse's last name"
                value={spouse.lastName}
                onChange={(lastName) => update((d) => void (d.input.spouse = { ...spouse, lastName }))}
              />
              <TextInput
                label="Spouse's social security number"
                value={details.spouse.ssn}
                onChange={(ssn) => update((d) => void (d.details.spouse.ssn = ssn))}
              />
            </div>
          ) : (
            <PersonFields
              who="spouse"
              person={spouse}
              identity={details.spouse}
              onPerson={(change) => update((d) => void (d.input.spouse = { ...spouse, ...change }))}
              onIdentity={(change) => update((d) => Object.assign(d.details.spouse, change))}
            />
          )}
        </>
      )}

      <h3>A few more questions</h3>
      <YesNo
        label={status === "marriedFilingJointly" ? "Was your main home (and your spouse's) in the United States for more than half of 2026?" : "Was your main home in the United States for more than half of 2026?"}
        hint="Required for the earned income credit."
        value={input.mainHomeInUsMoreThanHalfYear}
        onChange={(v) => update((d) => void (d.input.mainHomeInUsMoreThanHalfYear = v))}
      />
      <YesNo
        label={status === "marriedFilingJointly" ? "Is either of you a U.S. citizen, U.S. national, or qualified alien?" : "Are you a U.S. citizen, U.S. national, or qualified alien?"}
        hint="New for 2026 (Schedule 3-A): refundable credits beyond your tax, such as the earned income credit, are paid only if you answer yes."
        value={input.citizenNationalOrQualifiedAlien}
        onChange={(v) => update((d) => void (d.input.citizenNationalOrQualifiedAlien = v))}
      />
      {(status === "marriedFilingSeparately" || status === "headOfHousehold") && (
        <Checkbox
          label="I lived apart from my spouse for the last 6 months of 2026, or I'm legally separated"
          checked={input.screening.livedApartFromSpouseLastSixMonths}
          onChange={(v) => update((d) => void (d.input.screening.livedApartFromSpouseLastSixMonths = v))}
        />
      )}
    </>
  );
}
