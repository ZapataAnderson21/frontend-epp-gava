import { Form, InputForm } from "../../../common/form";
import { serviceSaleApi } from "../../../data/apiUrl";
import type { ServiceSaleType } from "../../../data/types";
import { useFetch } from "../../../hooks";

interface ServiceSaleProps {
  serviceSaleId: number;
}

export default function ServiceSale({ serviceSaleId }: ServiceSaleProps) {

  const {data: serviceSale, error, loading} = useFetch<ServiceSaleType>(`${serviceSaleApi}${serviceSaleId}`);

  return (
    <Form name={serviceSale ? `Detalle de salida de caja chica: ${serviceSale.serviceSaleId}` : loading ? "Cargando..." : error ? "Error" : "Salida de caja chica no encontrada"} handleSubmit={() => {}}>
      <InputForm
        label="Recurso comprado"
        name="resourceName"
        value={serviceSale ? serviceSale.serviceName : ""}
        type="text"
        onChange={() => {}}
        disabled
      />
      <InputForm
        label="Monto"
        name="amount"
        value={serviceSale ? serviceSale.amount : ""}
        type="number"
        onChange={() => {}}
        disabled
      />
      <InputForm
        label="Descripción"
        name="description"
        value={serviceSale ? serviceSale.description : ""}
        type="text"
        onChange={() => {}}
        disabled
      />
    </Form>
  );
}
