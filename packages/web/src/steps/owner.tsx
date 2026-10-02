import type { Owner } from "@opentax/engine";
import { Select } from "../components/fields.tsx";
import type { SavedReturn } from "../lib/savedReturn.ts";

/** "Whose form is this?" — only on a joint return. */
export function OwnerSelect(props: { saved: SavedReturn; value: Owner; onChange: (owner: Owner) => void }) {
  const { input } = props.saved;
  if (input.filingStatus !== "marriedFilingJointly") return null;
  const name = (first: string, fallback: string) => first.trim() || fallback;
  return (
    <Select
      label="Whose is it?"
      value={props.value}
      onChange={props.onChange}
      options={[
        ["taxpayer", name(input.taxpayer.firstName, "You")],
        ["spouse", name(input.spouse?.firstName ?? "", "Your spouse")],
      ]}
    />
  );
}
