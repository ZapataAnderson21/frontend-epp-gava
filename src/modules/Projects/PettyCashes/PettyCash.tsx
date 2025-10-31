import { ReturnButton } from "../../../common/button";
import { Form, InputForm } from "../../../common/form";
import { pettyCashApi } from "../../../data/apiUrl";
import type { PettyCashType } from "../../../data/types";
import { useFetch } from "../../../hooks";
import { toDateLocalValue } from "../../../utils";

interface PettyCashProps {
  pettyCashId: number;
  closeAction: () => void;
}

export default function PettyCash({ pettyCashId, closeAction }: PettyCashProps) {

  const {data: pettyCash, error, loading} = useFetch<PettyCashType>(`${pettyCashApi}${pettyCashId}`);

  return (
   <div className="bg-white rounded-xl w-xl overflow-auto max-h-full">
      <Form name={pettyCash ? `Detalle de salida de caja chica: ${pettyCash.pettyCashId}` : loading ? "Cargando..." : error ? "Error" : "Salida de caja chica no encontrada"} handleSubmit={() => {}}>
        
        <InputForm
          label="Tipo de Gasto"
          name="expenseType"
          value={pettyCash ? pettyCash.expenseType : ""}
          type="text"
          onChange={() => {}}
          disabled
        />
        
        <InputForm
          label="Monto"
          name="amount"
          value={pettyCash ? pettyCash.amount : ""}
          type="number"
          onChange={() => {}}
          disabled
        />

        <InputForm
          label="Número de Comprobante"
          name="invoiceNumber"
          value={pettyCash ? pettyCash.invoiceNumber : ""}
          type="text"
          onChange={() => {}}
          disabled
        />

        <InputForm
          label="Fecha del Gasto"
          name="expenseDate"
          value={pettyCash ? toDateLocalValue(pettyCash.expenseDate) : ""}
          type="date"
          onChange={() => {}}
          disabled
        />

        <InputForm
          label="Fecha de registro"
          name="createdAt"
          value={pettyCash ? toDateLocalValue(pettyCash.createdAt) : ""}
          type="date"
          onChange={() => {}}
          disabled
        />

        <InputForm
          label="Descripción"
          name="description"
          value={pettyCash ? pettyCash.description : ""}
          type="text"
          onChange={() => {}}
          disabled
        />

        <ReturnButton onClick={closeAction} />
      </Form>
    </div>
  );
}
