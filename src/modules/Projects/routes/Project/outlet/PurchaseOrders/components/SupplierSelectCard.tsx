import { SelectForm, InputForm } from "../../../../../../../common/form";
import type { Supplier } from "../../../../../../../data/types";

interface Props {
  suppliers: Supplier[];
  selectSupplierId: number;
  onChangeSupplier: (id: number) => void;
  supplier?: Supplier;
  quotation: string;
  setQuotation: (v: string) => void;
  errorSupplier?: string;
}

export default function SupplierSelectCard({
  suppliers,
  selectSupplierId,
  onChangeSupplier,
  supplier,
  quotation,
  setQuotation,
  errorSupplier
}: Props) {
  return (
    <div className="grid-cols-1 flex flex-col h-full">
      <h1 className="text-xl font-bold">DATOS DEL PROVEEDOR</h1>
      <div className="flex flex-col gap-4 p-4 shadow-md shadow-gray-300 h-full">
        <div className="flex flex-row flex-wrap items-center gap-2">
          <SelectForm
            label="Proveedor"
            name="selectSupplierId"
            value={selectSupplierId || ""}
            onChange={(value) => onChangeSupplier(Number(value))}
            options={suppliers.map((s) => ({ value: s.supplierId, label: s.name }))}
            error={Boolean(errorSupplier)}
          />
        </div>
        {errorSupplier && <p className="text-xs text-red-600">{errorSupplier}</p>}

        {supplier && (
          <>
            <InputForm
              name="document"
              label={supplier.documentType === "dni" ? "DNI" : "RUC"}
              type="text"
              value={supplier.documentType === "dni" ? supplier.dni ?? "" : supplier.ruc ?? ""}
              onChange={() => {}}
              disabled
            />
            <InputForm name="contact_person" label="Contacto" type="text" value={supplier.contactName} onChange={() => {}} disabled />
            <InputForm name="correo" label="Correo" type="email" value={supplier.email ?? ""} onChange={() => {}} disabled />
            <InputForm name="phone" label="Teléfono" type="text" value={supplier.phone} onChange={() => {}} disabled />
            <InputForm name="quotation" label="Cotización" type="text" value={quotation} onChange={(e) => setQuotation(e.target.value)} />
          </>
        )}
      </div>
    </div>
  );
}
