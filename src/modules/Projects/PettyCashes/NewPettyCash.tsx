import { useState } from "react";
import { ButtonSubmit, Form, InputForm, SaveModal, SelectForm, TextAreaForm } from "../../../common/form";
import type { PettyCashType } from "../../../data/types";
import { useApiAction } from "../../../hooks";
import { pettyCashApi } from "../../../data/apiUrl";

interface NewPettyCashProps {
  projectId: number;
  successAction: () => void;
}

export default function NewPettyCash({ projectId, successAction }: NewPettyCashProps) {

  const [resourceName, setResourceName] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [resourceNameError, setResourceNameError] = useState("");
  const [amountError, setAmountError] = useState("");

  const { execute, loading, response, error } = useApiAction<PettyCashType>()

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSaveModal(true);

    // validaciones...
    if (!resourceName || resourceName.trim() === "") {
      setResourceNameError("El nombre del recurso es obligatorio.");
      return;
    }
    if (amount <= 0) {
      setAmountError("El monto debe ser mayor que cero.");
      return;
    }

    const body = { projectId, resourceName, amount, description, expenseType, expenseDate, invoiceNumber };
    const result = await execute(pettyCashApi, "POST", body);

    if (result.statusCode === 201) {
      successAction();

      // Limpia el formulario
      setDescription("");
      setResourceName("");
      setAmount(0);
      setResourceNameError("");
      setAmountError("");

      // Que el botón OK solo cierre el modal
      setOnOk(() => () => setOpenSaveModal(false));
    } else {
      setOnOk(() => () => setOpenSaveModal(false));
    }
  };


  return (
    <>
      <Form name= "Nuevo gasto de caja chica" handleSubmit={handleSubmit} >
        <InputForm
          label="Nombre del Gasto"
          value={resourceName}
          onChange={(e) => { setResourceName(e.target.value);}}
          name="resourceName"
          type="text"
          optional={false}
          error={resourceNameError}
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

        <InputForm
          label="Número de Comprobante"
          value={invoiceNumber}
          onChange={(e) => { setInvoiceNumber(e.target.value);}}
          name="invoiceNumber"
          type="text"
          optional={false}
        />

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
        <ButtonSubmit
          label="Guardar"
          loading={loading}
          loadingLabel="Guardando..."
        />
      </Form>
      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={response?.message || error || "Error al guardar"}
          error={!!error || response?.statusCode !== 201}
        />
      )}
    </>
  )
}