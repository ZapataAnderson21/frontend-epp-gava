import { useState } from "react";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SaveModal, SelectForm } from "../../common/form";
import { WorkerType } from "../../data/types";
import { useApiAction } from "../../hooks";
import { workerApi } from "../../data/apiUrl";
import { ReturnButton } from "../../common/button";

interface NewPettyCashProps {
  successAction: () => void;
  closeAction: () => void;
}

export default function NewPettyCash({ successAction, closeAction }: NewPettyCashProps) {

  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [workerType, setWorkerType] = useState<WorkerType>(WorkerType.Unspecified);

  const [errorDni, setErrorDni] = useState("");
  const [errorPhone, setErrorPhone] = useState("");

  const workerTypeOptions = Object.values(WorkerType).map((type, index) => ({
    value: index,
    label: type[1]
  }));

  const { execute, loading: saving, response, error: saveError } = useApiAction<Worker>();

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const handleSubmit = async (e: React.FormEvent) => {
    setErrorDni("");
    setErrorPhone("");

    e.preventDefault();
    setOpenSaveModal(true);

    if(dni.length !== 8 || !/^\d{8}$/.test(dni)) {
      setErrorDni("El DNI debe tener 8 dígitos y contener solo números");
      setOnOk(() => () => setOpenSaveModal(false));
      return;
    }

    if(phone && (phone.length !== 9 || !/^\d+$/.test(phone))) {
      setErrorPhone("El teléfono debe tener 9 dígitos y contener solo números");
      setOnOk(() => () => setOpenSaveModal(false));
      return;
    }

    const body = { fullName, dni, phone, address, workerType: workerType[0] };
    
    console.log(body);

    const result = await execute(workerApi, "POST", body);

    if (result.statusCode === 201) {
      successAction();

      // Limpia el formulario
      setFullName("");
      setDni("");
      setPhone("");
      setAddress("");
      setWorkerType(WorkerType.Unspecified);

      // Limpia los errores
      setErrorDni("");
      setErrorPhone("");

      // Que el botón OK solo cierre el modal
      setOnOk(() => () => setOpenSaveModal(false));
    } else {
      setOnOk(() => () => setOpenSaveModal(false));
    }
  };


  return (
    <div className="bg-white rounded-xl w-xl overflow-auto max-h-full">
      <Form name={"Nuevo Trabajador"} handleSubmit={handleSubmit} >
        <InputForm
          label="Nombre Completo"
          name="fullName"
          value={fullName}
          type="text"
          onChange={(e) => setFullName(e.target.value)}
        />
        <InputForm
          label="DNI"
          name="dni"
          value={dni}
          type="text"
          onChange={(e) => setDni(e.target.value)}
          error={errorDni}
        />
        <InputForm
          label="Celular"
          name="phone"
          value={phone}
          type="text"
          onChange={(e) => setPhone(e.target.value)}
          optional={true}
          error={errorPhone}
        />

        <InputForm
          label="Dirección"
          name="address"
          value={address}
          type="text"
          onChange={(e) => setAddress(e.target.value)}
          optional={true}
        />
        
        <SelectForm
          label="Tipo de trabajador"
          name="workerType"
          value={Object.values(WorkerType).indexOf(workerType)}
          options={workerTypeOptions}
          onChange={(value) => setWorkerType(Object.values(WorkerType)[value as number])}
        />

        <ButtonContainer>
          <ButtonSubmit 
            label="Guardar"
            loading={saving}
            loadingLabel="Guardando..."  
          />
          <ReturnButton onClick={closeAction} />
        </ButtonContainer>
      </Form>
      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={response?.message || saveError || "Error al guardar"}
          error={!!saveError || response?.statusCode !== 201}
        />
      )}
    </div>
  );
}