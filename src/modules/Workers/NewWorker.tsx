import { useState } from "react";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SelectForm } from "../../common/form";
import toast, { Toaster } from "react-hot-toast";
import { WorkerType, type Worker } from "../../data/types";
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
  const [birthDate, setBirthDate] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  const [errorDni, setErrorDni] = useState("");
  const [errorPhone, setErrorPhone] = useState("");

  const workerTypeOptions = Object.values(WorkerType).map((type, index) => ({
    value: index,
    label: type[1]
  }));

  const { execute, loading: saving } = useApiAction<Worker>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación
    const errors: string[] = [];
    if (!fullName.trim()) errors.push("El nombre completo es requerido");
    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
      errors.push("El DNI debe tener 8 dígitos y contener solo números");
      setErrorDni("El DNI debe tener 8 dígitos y contener solo números");
    } else {
      setErrorDni("");
    }
    if (phone && (phone.length !== 9 || !/^\d+$/.test(phone))) {
      errors.push("El teléfono debe tener 9 dígitos y contener solo números");
      setErrorPhone("El teléfono debe tener 9 dígitos y contener solo números");
    } else {
      setErrorPhone("");
    }

    if (errors.length > 0) {
      toast.error(
        <div>
          <strong>Errores de validación:</strong>
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    const body = {
      fullName,
      dni,
      phone,
      address,
      workerType: workerType[0],
      personalEmail,
      birthDate: birthDate || undefined,
    };

    await toast.promise(
      execute(workerApi, "POST", body),
      {
        loading: "Creando trabajador...",
        success: (result) => {
          successAction();
          setFullName("");
          setDni("");
          setPhone("");
          setAddress("");
          setBirthDate("");
          setPersonalEmail("");
          setWorkerType(WorkerType.Unspecified);
          setErrorDni("");
          setErrorPhone("");
          return result.message || "Trabajador creado exitosamente";
        },
        error: (err) => err.message || "Error al crear trabajador",
      }
    );
  };


  return (
    <div className="bg-white rounded-xl w-xl overflow-auto max-h-full">
      <Form name={"Nuevo Trabajador"} handleSubmit={handleSubmit} >
        <InputForm
          label="Nombre completo"
          name="fullName"
          value={fullName}
          type="text"
          onChange={(e) => setFullName(e.target.value)}
        />

        <SelectForm
          label="Tipo de trabajador"
          name="workerType"
          value={Object.values(WorkerType).indexOf(workerType)}
          options={workerTypeOptions}
          onChange={(value) => setWorkerType(Object.values(WorkerType)[value as number])}
        />
        
        <div className="flex gap-4">
          <InputForm
            label="DNI"
            name="dni"
            value={dni}
            type="text"
            onChange={(e) => setDni(e.target.value)}
            error={errorDni}
          />

          <InputForm
            label="Fecha de nacimiento"
            name="birthDate"
            value={birthDate}
            type="date"
            onChange={(e) => setBirthDate(e.target.value)}
            optional={true}
          />
        </div>
        
        <div className="flex gap-4">
          <InputForm
            label="Email Personal"
            name="personalEmail"
            value={personalEmail}
            type="email"
            onChange={(e) => setPersonalEmail(e.target.value)}
            optional={true}
          />

          <InputForm
            label="Teléfono"
            name="phone"
            value={phone}
            type="text"
            onChange={(e) => setPhone(e.target.value)}
            optional={true}
            error={errorPhone}
          />
        </div>

        <InputForm
          label="Dirección"
          name="address"
          value={address}
          type="text"
          onChange={(e) => setAddress(e.target.value)}
          optional={true}
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
      <Toaster position="top-center" />
    </div>
  );
}
