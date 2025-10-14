import { useState } from "react";
import { ButtonSubmit, Form, InputForm, SaveModal, TextAreaForm } from "../../../common/form";
import type { ServiceSaleType } from "../../../data/types";
import { useApiAction } from "../../../hooks";
import { serviceSaleApi } from "../../../data/apiUrl";

interface NewServiceSaleProps {
  projectId: number;
  successAction: () => void;
}

export default function NewServiceSale({ projectId, successAction }: NewServiceSaleProps) {

  const [serviceName, setServiceName] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [serviceNameError, setServiceNameError] = useState("");
  const [amountError, setAmountError] = useState("");

  const { execute, loading, response, error } = useApiAction<ServiceSaleType>()

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSaveModal(true);

    // validaciones...
    if (!serviceName || serviceName.trim() === "") {
      setServiceNameError("El nombre del servicio es obligatorio.");
      return;
    }
    if (amount <= 0) {
      setAmountError("El monto debe ser mayor que cero.");
      return;
    }

    const body = { projectId, serviceName, amount, description };
    const result = await execute(serviceSaleApi, "POST", body);

    if (result.statusCode === 201) {
      successAction();

      // Limpia el formulario
      setDescription("");
      setServiceName("");
      setAmount(0);
      setServiceNameError("");
      setAmountError("");

      // Que el botón OK solo cierre el modal
      setOnOk(() => () => setOpenSaveModal(false));
    } else {
      setOnOk(() => () => setOpenSaveModal(false));
    }
  };


  return (
    <>
      <Form name= "Nuevo servicio contratado" handleSubmit={handleSubmit} >
        <InputForm
          label="Nombre del Servicio"
          value={serviceName}
          onChange={(e) => { setServiceName(e.target.value);}}
          name="serviceName"
          type="text"
          optional={false}
          error={serviceNameError}
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