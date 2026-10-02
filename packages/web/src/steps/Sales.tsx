import { emptySale, type CapitalAssetSale } from "@opentax/engine";
import { Checkbox, DateInput, MoneyInput, RepeatingList, Select, TextInput } from "../components/fields.tsx";
import { removeAt } from "../lib/update.ts";
import { OwnerSelect } from "./owner.tsx";
import type { StepProps } from "./types.ts";

export function Sales({ saved, update }: StepProps) {
  const { input } = saved;
  return (
    <>
      <h2>Stock and crypto sales</h2>
      <p className="lead">
        Enter each sale from Form 1099-B (stocks, funds, bonds) or Form 1099-DA (crypto and other digital assets). Sales your
        broker didn't report go here too.
      </p>
      <RepeatingList
        items={input.capitalAssetSales}
        noun="sale"
        title={(s, i) => s.description || `Sale ${i + 1}`}
        empty={<p className="empty">No sales.</p>}
        onAdd={() => update((d) => void d.input.capitalAssetSales.push(emptySale({ dateSold: "" })))}
        onRemove={(i) => update((d) => void (d.input.capitalAssetSales = removeAt(d.input.capitalAssetSales, i)))}
        render={(s, i) => {
          const set = (change: Partial<CapitalAssetSale>) => update((d) => Object.assign(d.input.capitalAssetSales[i]!, change));
          return (
            <>
              <div className="grid">
                <OwnerSelect saved={saved} value={s.owner} onChange={(owner) => set({ owner })} />
                <TextInput label="Description" placeholder="100 sh. XYZ Co." value={s.description} onChange={(description) => set({ description })} />
                <TextInput label="Broker" value={s.brokerName} onChange={(brokerName) => set({ brokerName })} />
                <Select
                  label="Kind of asset"
                  value={s.assetType}
                  onChange={(assetType) => set({ assetType })}
                  options={[
                    ["security", "Stock, fund, or bond (1099-B)"],
                    ["digitalAsset", "Crypto or digital asset (1099-DA)"],
                  ]}
                />
                <Select
                  label="Holding period (1099-B box 2)"
                  value={s.term}
                  onChange={(term) => set({ term })}
                  options={[
                    ["short", "Short-term (1 year or less)"],
                    ["long", "Long-term (more than 1 year)"],
                  ]}
                />
                <DateInput label="Date acquired" hint="Leave blank for various or inherited." value={s.dateAcquired} onChange={(dateAcquired) => set({ dateAcquired })} />
                <DateInput label="Date sold" value={s.dateSold} onChange={(dateSold) => set({ dateSold })} />
                <MoneyInput label="Proceeds (box 1d)" value={s.proceeds} onChange={(proceeds) => set({ proceeds })} />
                <MoneyInput label="Cost basis (box 1e)" value={s.costBasis} onChange={(costBasis) => set({ costBasis })} />
                <MoneyInput label="Wash sale loss disallowed (box 1g)" value={s.washSaleLossDisallowed} onChange={(washSaleLossDisallowed) => set({ washSaleLossDisallowed })} />
                <MoneyInput label="Federal income tax withheld (box 4)" value={s.federalWithholding} onChange={(federalWithholding) => set({ federalWithholding })} />
              </div>
              <Checkbox label="Reported to me on a 1099-B or 1099-DA" checked={s.reportedOnForm} onChange={(reportedOnForm) => set({ reportedOnForm })} />
              {s.reportedOnForm && (
                <Checkbox
                  label="The form shows cost basis was reported to the IRS"
                  hint="Covered securities; box 12 on Form 1099-B is checked."
                  checked={s.basisReportedToIrs}
                  onChange={(basisReportedToIrs) => set({ basisReportedToIrs })}
                />
              )}
              <Checkbox
                label="This is a collectible"
                hint="Art, coins, precious metals, and some metal ETFs. Long-term gains are taxed at up to 28%."
                checked={s.collectible}
                onChange={(collectible) => set({ collectible })}
              />
            </>
          );
        }}
      />
      <h3>Losses carried over from 2025</h3>
      <p className="hint">From lines 8 and 13 of the Capital Loss Carryover Worksheet in last year's Schedule D instructions.</p>
      <div className="grid">
        <MoneyInput
          label="Short-term capital loss carryover"
          value={input.capitalLossCarryover.shortTerm}
          onChange={(shortTerm) => update((d) => void (d.input.capitalLossCarryover.shortTerm = shortTerm))}
        />
        <MoneyInput
          label="Long-term capital loss carryover"
          value={input.capitalLossCarryover.longTerm}
          onChange={(longTerm) => update((d) => void (d.input.capitalLossCarryover.longTerm = longTerm))}
        />
      </div>
    </>
  );
}
