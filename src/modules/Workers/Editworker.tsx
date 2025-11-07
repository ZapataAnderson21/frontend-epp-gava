import { useEffect, useState } from "react";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SaveModal, SelectForm } from "../../common/form";
import { workerApi } from "../../data/apiUrl";
import { type  Worker, WorkerType } from "../../data/types";
import { useApiAction, useCurrentUser, useFetch } from "../../hooks";
import { ReturnButton } from "../../common/button";
import { formatYMD, logisticsTypes } from "../../utils";
import Permission from "../../common/auth/Permission";

interface EditWorkerProps {
  workerId: number;
  successAction: () => void;
  closeAction: () => void;
}

export default function EditWorker({ workerId, successAction, closeAction }: EditWorkerProps) {
  const { user } = useCurrentUser();

  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [workerType, setWorkerType] = useState<WorkerType>(WorkerType.Unspecified);

  const [errorDni, setErrorDni] = useState("");
  const [errorPhone, setErrorPhone] = useState("");

  const workerTypeOptions = Object.values(WorkerType).map((type, index) => ({
    value: index,
    label: type[1]
  }));

  const {data: worker, error, loading} = useFetch<Worker>(`${workerApi}${workerId}`);

  const { execute, loading: saving, response, error: saveError } = useApiAction<Worker>();

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});
  

  const handleSubmit = async (e: React.FormEvent) => {
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

    const body = { fullName, dni, phone, address, workerType: workerType[0], personalEmail, birthDate };
    
    const result = await execute(`${workerApi}${workerId}`, "PATCH", body);

    if (result.statusCode === 200) {
      successAction();

      setErrorDni("");
      setErrorPhone("");

      setOnOk(() => () => {
        setOpenSaveModal(false);
        closeAction();
      });
    } else {
      setOnOk(() => () => setOpenSaveModal(false));
    }
  };

  useEffect(() => {
    if (worker) {
      setFullName(worker.fullName);
      setDni(worker.dni);
      setPhone(worker.phone ? worker.phone : "");
      setPersonalEmail(worker.personalEmail ? worker.personalEmail : "");
      setAddress(worker.address ? worker.address : "");
      setBirthDate(worker.birthDate ? formatYMD(worker.birthDate) : "");
      setWorkerType(Object.values(WorkerType).find(type => type[0] === worker.workerType) || WorkerType.Unspecified);
    }
  }, [worker]); 

  return (
    <Permission user={user} allow={logisticsTypes}>
      <div className="bg-white rounded-xl w-xl overflow-auto max-h-full">
        <Form name={worker ? `Detalle del trabajador ${worker.workerId}` : loading ? "Cargando..." : error ? "Error" : "Salida de caja chica no encontrada"} handleSubmit={handleSubmit} >
          <InputForm
            label="Nombre completo"
            name="fullName"
            value={fullName}
            type="text"
            onChange={(e) => setFullName(e.target.value)}
          />
          
          <div className="flex gap-4">
            <InputForm
              label="DNI"
              name="dni"
              value={worker ? worker.dni : ""}
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
            error={!!saveError || response?.statusCode !== 200}
          />
        )}
      </div>
    </Permission>
  );
}
