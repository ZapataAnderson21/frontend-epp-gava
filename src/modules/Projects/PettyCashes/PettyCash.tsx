import { useEffect, useState } from "react";
import { ReturnButton, SaveButton } from "../../../common/button";
import { ButtonContainer, Form, InputForm, SaveModal, SelectForm } from "../../../common/form";
import { pettyCashApi } from "../../../data/apiUrl";
import type { PettyCashType } from "../../../data/types";
import { useApiAction, useFetch } from "../../../hooks";
import { toDateLocalValue } from "../../../utils";
import { LoadingSkeletonForm } from "../../../common/loading";
import { ErrorMessage } from "../../../common/error";

interface PettyCashProps {
  pettyCashId: number;
  closeAction: () => void;
}

export default function PettyCash({ pettyCashId, closeAction }: PettyCashProps) {

  const {data: pettyCash, error: fetchError, loading} = useFetch<PettyCashType>(`${pettyCashApi}${pettyCashId}`);
  const [expenseType, setExpenseType] =  useState<string>("");
  const [amount, setAmount] =  useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] =  useState<string>("");
  const [expenseDate, setExpenseDate] =  useState<string>("");
  const [description, setDescription] =  useState<string>("");

  const {execute, loading: saving} = useApiAction<PettyCashType>();

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);

  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  useEffect(() => {
    if (pettyCash) {
      setExpenseType(pettyCash.expenseType);
      setAmount(pettyCash.amount);
      setInvoiceNumber(pettyCash.invoiceNumber);
      setExpenseDate(pettyCash.expenseDate);
      setDescription(pettyCash.description);
    }
  }, [pettyCash]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setOpenSaveModal(true);

    const updatedPettyCash = {
      expenseType,
      amount,
      invoiceNumber,
      expenseDate,
      description,
    };

    const res = await execute(`${pettyCashApi}${pettyCashId}`, "PATCH", updatedPettyCash);
    
    setSuccessMessage(res.message);
    setOpenSaveModal(false);

    if(res.statusCode == 200) {
      setOnOk(() => () => {
        setOpenSaveModal(false);
        closeAction();
      });
    } else {
      setError(true);
    }
  }

  if(loading) return <LoadingSkeletonForm numberRows={6} />;
  if(fetchError) return <ErrorMessage errorMessage="Error al cargar la salida de caja chica" />;

  return (
   <div className="bg-white rounded-xl w-xl overflow-auto max-h-full">
      <Form name={pettyCash ? `Detalle de salida de caja chica: ${pettyCash.pettyCashId}` : loading ? "Cargando..." : error ? "Error" : "Salida de caja chica no encontrada"} handleSubmit={handleUpdate} >
        
        <SelectForm
          label="Tipo de Gasto"
          name="expenseType"
          value={expenseType}
          onChange={(value) => setExpenseType(value)}
          options={[
            { value: "meals", label: "Alimentación" },
            { value: "fuel", label: "Combustible" },
            { value: "transport", label: "Transporte" },
            { value: "supplies", label: "Materiales / Insumos" },
            { value: "safety_equipment", label: "Equipo de Seguridad" },
            { value: "services", label: "Servicios" },
            { value: "other", label: "Otros" }
          ]}
        />
        
        <InputForm
          label="Monto"
          name="amount"
          value={amount}
          type="number"
          onChange={(e) => setAmount(Number(e.target.value))}
          disabled
        />

        <InputForm
          label="Número de Comprobante"
          name="invoiceNumber"
          value={invoiceNumber}
          type="text"
          onChange={(e) => setInvoiceNumber(e.target.value)}
          disabled
        />

        <InputForm
          label="Fecha del Gasto"
          name="expenseDate"
          value={expenseDate}
          type="date"
          onChange={(e) => setExpenseDate(e.target.value)}
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
          value={description}
          type="text"
          onChange={(e) => setDescription(e.target.value)}
          disabled
        />

        <ButtonContainer>
          <ReturnButton onClick={closeAction} />
          <SaveButton loading={saving} />
        </ButtonContainer>

      </Form>
      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={successMessage}
          error={error}
        />
      )}
    </div>
  );
}
