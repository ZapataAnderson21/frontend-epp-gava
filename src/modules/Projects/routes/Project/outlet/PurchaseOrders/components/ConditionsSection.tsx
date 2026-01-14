import { FaMinus, FaPlus } from "react-icons/fa";

interface SectionProps {
  title: string;
  values: string[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, value: string) => void;
  placeholderBase: string;
}

export default function ConditionsSection({
  title, values, onAdd, onRemove, onChange, placeholderBase,
}: SectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex flex-col gap-2 items-center">
        {values.map((val, idx) => (
          <div key={idx} className="flex flex-row gap-2 w-full items-center">
            <input
              className="cursor-text border border-gray-300 text-gray-900 rounded-sm  focus:outline-[#0047a3] block w-full p-2.5"
              type="text"
              value={val}
              onChange={(e) => onChange(idx, e.target.value)}
              placeholder={`${placeholderBase} ${idx + 1}`}
              style={{ marginBottom: "8px", width: "100%" }}
            />
            <div className="flex gap-2 text-md">
              <button type="button" className="bg-red-500 text-white p-2 rounded-md cursor-pointer w-full" onClick={() => onRemove(idx)}>
                <FaMinus />
              </button>
              <button type="button" className="bg-black text-white p-2 rounded-md cursor-pointer w-full" onClick={onAdd}>
                <FaPlus />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Inline select pequeñito reutilizable (para "materiales/servicios" u otros) */
function SelectInline({
  label, name, value, onChange, options, purchaseOrderTypeError
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  purchaseOrderTypeError?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="font-semibold text-nowrap text-gray-700" htmlFor={name}>{label}</label>
      <div className="relative w-fit">
        <select
          id={name}
          className={`p-[10px] border ${purchaseOrderTypeError ? "border-red-500" : "border-gray-400"} rounded-sm  focus:outline-[#0047a3]`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>Seleccionar...</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {purchaseOrderTypeError && <span className="absolute text-nowrap text-xs top-12 left-0 text-red-500">{purchaseOrderTypeError}</span>}
      </div>
    </div>
  );
}

// exportar como propiedad del componente para uso sencillo
ConditionsSection.SelectInline = SelectInline as any;
