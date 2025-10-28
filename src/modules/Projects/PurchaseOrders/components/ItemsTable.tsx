import { FaMinus, FaPlus } from "react-icons/fa";
import type { Resource } from "../../../../data/types";

type ItemRow = {
  resourceId: number;
  description: string;
  unit: string;
  quantity: string;
  unitPurchasePrice: string;
  unitSalesPrice: string;
  subtotal: number;
};

type ItemErrors = Partial<{
  resourceId: string;
  quantity: string;
  unitPurchasePrice: string;
  unitSalesPrice: string;
}>;

interface Props {
  items: ItemRow[];
  resources: Resource[];
  onChange: (index: number, field: keyof ItemRow, value: any) => void;
  onAddRow: (rowIndex?: number) => void;
  onRemoveRow: (rowIndex: number) => void;
  supplierCurrency?: string;
  saleAmount: number;
  purchaseAmount: number;
  itemErrors?: ItemErrors[];
}

export default function ItemsTable({
  items, resources, onChange, onAddRow, onRemoveRow,
  supplierCurrency, saleAmount, purchaseAmount, itemErrors
}: Props) {
  const sym = supplierCurrency?.toUpperCase() === "PEN" ? "S/." : "$";

  const inputCls = (hasError?: boolean) =>
    `w-full p-2 bg-gray-50 rounded-md border ${hasError ? "border-red-600 ring-1 ring-red-300" : "border-gray-400"}`;

  const numberCls = (hasError?: boolean) =>
    `w-full min-w-16 p-2 bg-gray-50 rounded-md border ${hasError ? "border-red-600 ring-1 ring-red-300" : "border-gray-400"}`;

  const errorText = (msg?: string) =>
    msg ? <p className="text-xs text-red-600 mt-1 text-left">{msg}</p> : null;

  return (
    <div className="overflow-x-auto">
      <table className="text-center w-full">
        <thead className="bg-[#14519d] border-1 border-[#14519d] text-white">
          <tr>
            <th className="p-2 border-r-1 border-[#f3f4f6] text-nowrap">DESCRIPCIÓN</th>
            <th className="p-2 border-r-1 border-[#f3f4f6] text-nowrap">UND</th>
            <th className="p-2 border-r-1 border-[#f3f4f6] text-nowrap">CANT</th>
            <th className="p-2 border-r-1 border-[#f3f4f6] text-nowrap">PR UNIT COMP</th>
            <th className="p-2 border-r-1 border-[#f3f4f6] text-nowrap">PR UNIT VENT</th>
            <th className="p-2 border-r-1 border-[#f3f4f6] text-nowrap">PR PARC COMP</th>
            <th className="p-2 border-r-1 border-[#f3f4f6] text-nowrap">PR PARC VENT</th>
            <th className="p-2 border-gray-100 text-nowrap">ACCIONES</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => {
            const ie = itemErrors?.[index];

            return (
              <tr key={index}>
                {/* DESCRIPCIÓN / RECURSO */}
                <td className="p-2 border-1 border-gray-400 text-nowrap max-w-120">
                  <div className="flex flex-col">
                    <select
                      className={`w-full p-2 rounded-md bg-gray-50 min-w-64 border ${ie?.resourceId ? "border-red-600 ring-1 ring-red-300" : "border-gray-400"}`}
                      value={item.resourceId || ""}
                      onChange={(e) => onChange(index, "resourceId", e.target.value)}
                      aria-invalid={!!ie?.resourceId}
                    >
                      <option value="">Seleccionar...</option>
                      {resources.map((r) => (
                        <option key={r.resourceId} value={r.resourceId}>
                          {r.description}
                        </option>
                      ))}
                    </select>
                    {errorText(ie?.resourceId)}
                  </div>
                </td>

                {/* UND */}
                <td className="p-2 border-1 border-gray-400 text-nowrap">
                  <p>{item.unit}</p>
                </td>

                {/* CANT */}
                <td className="p-2 border-1 border-gray-400 text-nowrap">
                  <div className="flex flex-col">
                    <input
                      className={numberCls(!!ie?.quantity)}
                      type="number"
                      value={item.quantity}
                      min="0"
                      onChange={(e) => onChange(index, "quantity", e.target.value)}
                      aria-invalid={!!ie?.quantity}
                    />
                    {errorText(ie?.quantity)}
                  </div>
                </td>

                {/* PR UNIT COMP */}
                <td className="p-2 border-1 border-gray-400 text-nowrap">
                  <div className="flex flex-col">
                    <input
                      className={inputCls(!!ie?.unitPurchasePrice)}
                      type="text"
                      value={item.unitPurchasePrice}
                      onChange={(e) => onChange(index, "unitPurchasePrice", e.target.value)}
                      aria-invalid={!!ie?.unitPurchasePrice}
                    />
                    {errorText(ie?.unitPurchasePrice)}
                  </div>
                </td>

                {/* PR UNIT VENT */}
                <td className="p-2 border-1 border-gray-400 text-nowrap">
                  <div className="flex flex-col">
                    <input
                      className={numberCls(!!ie?.unitSalesPrice)}
                      type="number"
                      value={item.unitSalesPrice}
                      min="0"
                      onChange={(e) => onChange(index, "unitSalesPrice", e.target.value)}
                      aria-invalid={!!ie?.unitSalesPrice}
                    />
                    {errorText(ie?.unitSalesPrice)}
                  </div>
                </td>

                {/* PR PARC COMP */}
                <td className="p-2 border-1 border-gray-400 text-nowrap">
                  <p>{sym} {item.subtotal.toFixed(2)}</p>
                </td>

                {/* PR PARC VENT */}
                <td className="p-2 border-1 border-gray-400 text-nowrap">
                  <p>{sym} {((Number(item.unitSalesPrice) || 0) * (Number(item.quantity) || 0)).toFixed(2)}</p>
                </td>

                {/* ACCIONES */}
                <td className="p-2 border-1 border-gray-400 text-nowrap">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="bg-red-500 text-white p-2 rounded-md cursor-pointer"
                      onClick={() => onRemoveRow(index)}
                    >
                      <FaMinus />
                    </button>
                    <button
                      type="button"
                      className="bg-black text-white p-2 rounded-md cursor-pointer"
                      onClick={() => onAddRow(index)}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={5} className="p-2 pr-8 font-bold text-right">SUBTOTAL</td>
            <td className="p-2 border-1 border-gray-400 bg-gray-100">{sym} {purchaseAmount.toFixed(2)}</td>
            <td className="p-2 border-1 border-gray-400 bg-gray-100">{sym} {saleAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={6} className="p-2 pr-8 font-bold text-right">IGV</td>
            <td className="p-2 border-1 border-gray-400 bg-gray-100">{sym} {(saleAmount * 0.18).toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={6} className="p-2 pr-8 font-bold text-right">TOTAL</td>
            <td className="p-2 border-1 border-gray-400 text-white bg-gray-800">{sym} {(saleAmount * 1.18).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
