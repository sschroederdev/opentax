import { TextInput, YesNo, Select } from "../components/fields.tsx";
import type { StepProps } from "./types.ts";

export function Contact({ saved, update }: StepProps) {
  const { details, input } = saved;
  const a = details.address;
  const bank = details.directDeposit;
  const soldCrypto = input.capitalAssetSales.some((s) => s.assetType === "digitalAsset");
  return (
    <>
      <h2>Address and refund</h2>
      <p className="lead">These go on the printed forms. They stay on this device and don't affect your tax.</p>
      <div className="grid">
        <TextInput label="Street address" wide value={a.street} autoComplete="street-address" onChange={(street) => update((d) => void (d.details.address.street = street))} />
        <TextInput label="Apt. no." value={a.apartment} onChange={(apartment) => update((d) => void (d.details.address.apartment = apartment))} />
        <TextInput label="City" value={a.city} autoComplete="address-level2" onChange={(city) => update((d) => void (d.details.address.city = city))} />
        <TextInput label="State" maxLength={2} value={a.state} onChange={(state) => update((d) => void (d.details.address.state = state.toUpperCase()))} />
        <TextInput label="ZIP code" value={a.zip} autoComplete="postal-code" onChange={(zip) => update((d) => void (d.details.address.zip = zip))} />
        <TextInput label="Phone" value={details.phone} autoComplete="tel" onChange={(phone) => update((d) => void (d.details.phone = phone))} />
        <TextInput label="Email" value={details.email} autoComplete="email" onChange={(email) => update((d) => void (d.details.email = email))} />
      </div>

      <YesNo
        label="At any time in 2026, did you receive digital assets (such as crypto) as payment or a reward, or sell, exchange, or otherwise dispose of any?"
        hint={soldCrypto ? "You entered a crypto sale, so the answer is yes." : "Form 1040, page 1. Just holding crypto counts as no."}
        value={details.digitalAssets ?? (soldCrypto ? true : null)}
        onChange={(v) => update((d) => void (d.details.digitalAssets = v))}
      />

      <h3>Direct deposit</h3>
      <YesNo
        label="If you get a refund, do you want it deposited in your bank account?"
        hint="The IRS no longer mails paper checks except in limited cases."
        value={bank !== null}
        onChange={(yes) =>
          update((d) => void (d.details.directDeposit = yes ? (d.details.directDeposit ?? { routingNumber: "", accountNumber: "", accountType: "checking" }) : null))
        }
      />
      {bank && (
        <div className="grid">
          <TextInput label="Routing number" maxLength={9} value={bank.routingNumber} onChange={(routingNumber) => update((d) => void (d.details.directDeposit!.routingNumber = routingNumber.replace(/\D/g, "")))} />
          <TextInput label="Account number" maxLength={17} value={bank.accountNumber} onChange={(accountNumber) => update((d) => void (d.details.directDeposit!.accountNumber = accountNumber.replace(/[^\dA-Za-z-]/g, "")))} />
          <Select
            label="Account type"
            value={bank.accountType}
            onChange={(accountType) => update((d) => void (d.details.directDeposit!.accountType = accountType))}
            options={[
              ["checking", "Checking"],
              ["savings", "Savings"],
            ]}
          />
        </div>
      )}
    </>
  );
}
