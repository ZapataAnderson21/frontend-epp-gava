import { useState } from "react";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SelectForm, TextAreaForm } from "../../../../../../common/form";
import type { PettyCashType } from "../../../../../../data/types";
import { useApiAction } from "../../../../../../hooks";
import { pettyCashApi } from "../../../../../../data/apiUrl";
import { ReturnButton } from "../../../../../../common/button";
import { ymdLocalMidnightToUtc } from "../../../../../../utils";
import toast, { Toaster } from "react-hot-toast";

interface NewPettyCashProps {
  projectId: number;
  successAction: () => void;
  closeAction: () => void;
}

export default function NewPettyCash({ projectId, successAction, closeAction }: NewPettyCashProps) {

  const [amount, setAmount] = useState(0);
  const [includesIgv, setIncludesIgv] = useState(true);
  const [description, setDescription] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [amountError, setAmountError] = useState("");

  const { execute, loading } = useApiAction<PettyCashType>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      setAmountError("El monto debe ser mayor que cero.");
      toast.error("El monto debe ser mayor que cero.");
      return;
    }

    const body = { projectId, amount, includesIgv, description, expenseType, expenseDate: ymdLocalMidnightToUtc(expenseDate, 'America/Lima'), invoiceNumber };

    toast.promise(
      execute(pettyCashApi, "POST", body),
      {
        loading: 'Creando gasto de caja chica...',
        success: (result) => {
          successAction();
          setDescription("");
          setAmount(0);
          setIncludesIgv(true);
          setAmountError("");
          setExpenseType("");
          setExpenseDate("");
          setInvoiceNumber("");
          return result.message || 'Gasto de caja chica creado con éxito';
        },
        error: (err) => err.message || 'Error al crear el gasto de caja chica',
      }
    );
  };


  return (
    <div className="bg-white rounded-xl w-xl overflow-auto max-h-full">
      <Toaster position="top-center" reverseOrder={false} />
      <Form name= "Nuevo gasto de caja chica" handleSubmit={handleSubmit} >
        <SelectForm
          label="Tipo de Gasto"
          name="expenseType"
          value={expenseType}
          onChange={(value) => { setExpenseType(value);}}
          options={[
            { label: "Comidas", value: "meals" },
            { label: "Combustible", value: "fuel" },
            { label: "Transporte", value: "transport" },
            { label: "Materiales / Insumos", value: "supplies" },
            { label: "Equipo de Seguridad", value: "safety_equipment" },
            { label: "Servicios", value: "services" },
            { label: "Otros", value: "other" }
          ]}
        />
        
        <InputForm
          label="Monto"
          value={amount}
          onChange={(e) => { setAmount(Number(e.target.value));}}
          name="amount"
          type="number"
          optional={false}
          error={amountError}
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
          value={invoiceNumber}
          onChange={(e) => { setInvoiceNumber(e.target.value);}}
          name="invoiceNumber"
          type="text"
          optional={false}
        />

        <InputForm
          label="Fecha"
          value={expenseDate}
          onChange={(e) => { setExpenseDate(e.target.value);}}
          name="expenseDate"
          type="date"
          optional={false}
        />

        <TextAreaForm
          label="Descripción"
          value={description}
          onChange={(e) => { setDescription(e.target.value);}}
          name="description"
          optional={true}
        />
        <ButtonContainer>
          <ButtonSubmit
            label="Guardar"
            loading={loading}
            loadingLabel="Guardando..."
          />
          <ReturnButton onClick={closeAction} />
        </ButtonContainer>
      </Form>
    </div>
  )
}
