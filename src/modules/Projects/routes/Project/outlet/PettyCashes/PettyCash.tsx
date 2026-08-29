import { useEffect, useState } from "react";
import { ReturnButton, SaveButton } from "../../../../../../common/button";
import { ButtonContainer, Form, InputForm, SelectForm, TextAreaForm } from "../../../../../../common/form";
import { pettyCashApi } from "../../../../../../data/apiUrl";
import type { PettyCashType } from "../../../../../../data/types";
import { useApiAction, useFetch } from "../../../../../../hooks";
import { toDateLocalValue, ymdLocalMidnightToUtc } from "../../../../../../utils";
import { LoadingSkeletonForm } from "../../../../../../common/loading";
import { ErrorMessage } from "../../../../../../common/error";
import toast, { Toaster } from "react-hot-toast";

interface PettyCashProps {
  pettyCashId: number;
  successAction: () => void;
  closeAction: () => void;
}

export default function PettyCash({ pettyCashId, successAction, closeAction }: PettyCashProps) {

  const {data: pettyCash, error: fetchError, loading} = useFetch<PettyCashType>(`${pettyCashApi}${pettyCashId}`);
  const [expenseType, setExpenseType] =  useState<string>("");
  const [amount, setAmount] =  useState<number>(0);
  const [includesIgv, setIncludesIgv] = useState(true);
  const [invoiceNumber, setInvoiceNumber] =  useState<string>("");
  const [expenseDate, setExpenseDate] =  useState<string>("");
  const [description, setDescription] =  useState<string>("");

  const {execute, loading: saving} = useApiAction<PettyCashType>();

  useEffect(() => {
    if (pettyCash) {
      setExpenseType(pettyCash.expenseType);
      setAmount(pettyCash.amount);
      setIncludesIgv(pettyCash.includesIgv ?? true);
      setInvoiceNumber(pettyCash.invoiceNumber);
      setExpenseDate(toDateLocalValue(pettyCash.expenseDate));
      setDescription(pettyCash.description);
    }
  }, [pettyCash]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const updatedPettyCash = {
      expenseType,
      amount,
      includesIgv,
      invoiceNumber,
      expenseDate: ymdLocalMidnightToUtc(expenseDate, 'America/Lima'),
      description,
    };

    toast.promise(
      execute(`${pettyCashApi}${pettyCashId}`, "PATCH", updatedPettyCash),
      {
        loading: 'Actualizando gasto de caja chica...',
        success: (result) => {
          successAction();
          setTimeout(() => closeAction(), 1200);
          return result.message || 'Gasto de caja chica actualizado con éxito';
        },
        error: (err) => err.message || 'Error al actualizar el gasto de caja chica',
      }
    );
  }

  if(loading) return <LoadingSkeletonForm numberRows={7} />;
  if(fetchError) return <ErrorMessage errorMessage="Error al cargar la salida de caja chica" />;

  return (
   <div className="bg-white rounded-xl w-xl overflow-auto max-h-full">
      <Toaster position="top-center" reverseOrder={false} />
      <Form name={pettyCash ? `Detalle de salida de caja chica: ${pettyCash.pettyCashId}` : loading ? "Cargando..." : fetchError ? "Error" : "Salida de caja chica no encontrada"} handleSubmit={handleUpdate} >
        
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
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <input
            type="checkbox"
            checked={includesIgv}
            onChange={(e) => setIncludesIgv(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[#0047a3]"
          />
          <span className="flex flex-col">
            <span className="font-medium text-gray-800">El monto incluye IGV (18%)</span>
            <span className="text-sm text-gray-500">
              {includesIgv
                ? "El resumen económico usará el monto registrado."
                : "El resumen económico añadirá el 18% al monto registrado."}
            </span>
          </span>
        </label>

        <InputForm
          label="Número de Comprobante"
          name="invoiceNumber"
          value={invoiceNumber}
          type="text"
          onChange={(e) => setInvoiceNumber(e.target.value)}
        />

        <InputForm
          label="Fecha del Gasto"
          name="expenseDate"
          value={expenseDate}
          type="date"
          onChange={(e) => setExpenseDate(e.target.value)}
        />

        <InputForm
          label="Fecha de registro"
          name="createdAt"
          value={pettyCash ? toDateLocalValue(pettyCash.createdAt) : ""}
          type="date"
          onChange={() => {}}
          disabled
        />

        <TextAreaForm
          label="Descripción"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          optional
        />

        <ButtonContainer>
          <ReturnButton onClick={closeAction} />
          <SaveButton loading={saving} />
        </ButtonContainer>

      </Form>
    </div>
  );
}
