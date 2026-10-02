import { emptyDependent, type DependentRelationship } from "@opentax/engine";
import { Checkbox, DateInput, NumberInput, RepeatingList, Select, TextInput } from "../components/fields.tsx";
import { removeAt } from "../lib/update.ts";
import type { StepProps } from "./types.ts";

const RELATIONSHIPS: [DependentRelationship, string][] = [
  ["child", "Son or daughter"],
  ["stepchild", "Stepchild"],
  ["fosterChild", "Foster child"],
  ["sibling", "Brother or sister"],
  ["halfSibling", "Half brother or sister"],
  ["stepsibling", "Stepbrother or stepsister"],
  ["descendantOfQualifyingRelative", "Grandchild, niece, or nephew"],
  ["parent", "Parent"],
  ["other", "Other relative or household member"],
];

export function Dependents({ saved, update }: StepProps) {
  const { input, details } = saved;
  return (
    <>
      <h2>Dependents</h2>
      <p className="lead">Children and other relatives you support. They can qualify you for the child tax credit, the earned income credit, and head of household status.</p>
      <RepeatingList
        items={input.dependents}
        noun="dependent"
        title={(d, i) => `${d.firstName || "Dependent"} ${d.lastName}`.trim() || `Dependent ${i + 1}`}
        empty={<p className="empty">No dependents.</p>}
        onAdd={() =>
          update((d) => {
            d.input.dependents.push(emptyDependent({ lastName: d.input.taxpayer.lastName, dateOfBirth: "" }));
            d.details.dependentSsns[d.input.dependents.length - 1] = "";
          })
        }
        onRemove={(i) =>
          update((d) => {
            d.input.dependents = removeAt(d.input.dependents, i);
            d.details.dependentSsns = removeAt(d.details.dependentSsns, i);
          })
        }
        render={(dep, i) => {
          const set = (change: Partial<typeof dep>) => update((d) => Object.assign(d.input.dependents[i]!, change));
          return (
            <>
              <div className="grid">
                <TextInput label="First name" value={dep.firstName} onChange={(firstName) => set({ firstName })} />
                <TextInput label="Last name" value={dep.lastName} onChange={(lastName) => set({ lastName })} />
                <DateInput label="Date of birth" value={dep.dateOfBirth} onChange={(dateOfBirth) => set({ dateOfBirth })} />
                <Select label="Relationship to you" value={dep.relationship} options={RELATIONSHIPS} onChange={(relationship) => set({ relationship })} />
                <NumberInput
                  label="Months lived with you in the U.S."
                  hint="Count 12 for a child born or who died in 2026 and lived with you the whole time."
                  min={0}
                  max={12}
                  value={dep.monthsLivedWithFiler}
                  onChange={(monthsLivedWithFiler) => set({ monthsLivedWithFiler })}
                />
                <TextInput
                  label="Social security number"
                  value={details.dependentSsns[i] ?? ""}
                  onChange={(ssn) => update((d) => void (d.details.dependentSsns[i] = ssn))}
                />
              </div>
              <Checkbox
                label="Has a social security number valid for employment"
                hint="Required for the child tax credit."
                checked={dep.hasValidSsn}
                onChange={(hasValidSsn) => set({ hasValidSsn })}
              />
              <Checkbox label="Full-time student in 2026" checked={dep.fullTimeStudent} onChange={(fullTimeStudent) => set({ fullTimeStudent })} />
              <Checkbox
                label="Permanently and totally disabled"
                checked={dep.permanentlyDisabled}
                onChange={(permanentlyDisabled) => set({ permanentlyDisabled })}
              />
            </>
          );
        }}
      />
    </>
  );
}
