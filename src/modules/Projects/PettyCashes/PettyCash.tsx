import { Form, InputForm } from "../../../common/form";
import { pettyCashApi } from "../../../data/apiUrl";
import type { PettyCashType } from "../../../data/types";
import { useFetch } from "../../../hooks";

interface PettyCashProps {
  pettyCashId: number;
}

export default function PettyCash({ pettyCashId }: PettyCashProps) {

  const {data: pettyCash, error, loading} = useFetch<PettyCashType>(`${pettyCashApi}${pettyCashId}`);

  return (
    <Form name={pettyCash ? `Detalle de salida de caja chica: ${pettyCash.pettyCashId}` : loading ? "Cargando..." : error ? "Error" : "Salida de caja chica no encontrada"} handleSubmit={() => {}}>
      <InputForm
        label="Recurso comprado"
        name="resourceName"
        value={pettyCash ? pettyCash.resourceName : ""}
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
        label="Descripción"
        name="description"
        value={pettyCash ? pettyCash.description : ""}
        type="text"
        onChange={() => {}}
        disabled
      />
    </Form>
  );
}
