import SelectForm from "../../../common/form/SelectForm";

export type Currency = "PEN" | "USD" | "EUR";

interface Props {
  currency: Currency;
  onChange: (c: Currency) => void;
}

const options = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
  { value: "EUR", label: "Euros (EUR)" },
] as const;

export default function CurrencyFilter({ currency, onChange }: Props) {
  return (
    <div className="min-w-[220px]">
      <SelectForm<Currency>
        label="Moneda"
        name="currency"
        value={currency}
        onChange={onChange}
        options={options as unknown as { value: Currency; label: string }[]}
        directionRow
      />
    </div>
  );
}
