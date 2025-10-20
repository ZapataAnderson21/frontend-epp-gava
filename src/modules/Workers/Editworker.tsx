import { useEffect, useState } from "react";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SaveModal, SelectForm } from "../../common/form";
import type { Option } from "../../common/form/SelectForm";
import { workerApi, workerGroupApi } from "../../data/apiUrl";
import type { Worker, WorkerGroup } from "../../data/types";
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
  const [workerGroupId, setWorkerGroupId] = useState(0);

  const [errorDni, setErrorDni] = useState("");
  const [errorPhone, setErrorPhone] = useState("");

  const {data: workerGroups, error: workerGroupsError, loading: workerGroupsLoading} = useFetch<WorkerGroup[]>(`${workerGroupApi}`);
  
  const formatWorkerGroupOptions = (workerGroups: WorkerGroup[]): Option<number>[] => {
    const buildGroupName = (group: WorkerGroup): string => {
      if (group.parentGroup) {
        return `${buildGroupName(group.parentGroup)}-${group.name}`;
      }
      return group.name;
    };

    return workerGroups.map(group => ({
      value: group.workerGroupId,
      label: buildGroupName(group)
    }));
  };

  const workerGroupOptions = workerGroups ? formatWorkerGroupOptions(workerGroups) : [];

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

    const body = { fullName, dni, phone, address, workerGroupId, personalEmail, birthDate };
    
    const result = await execute(`${workerApi}${workerId}`, "PATCH", body);

    if (result.statusCode === 200) {
      successAction();

      setErrorDni("");
      setErrorPhone("");

      // Que el botón OK solo cierre el modal
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
      setWorkerGroupId(worker.workerGroupId);
    }
  }, [worker]); 

  return (
    <Permission user={user} allow={logisticsTypes}>
      <div className="bg-white rounded-xl w-xl">
        <Form name={worker ? `Detalle del trabajador ${worker.workerId}` : loading ? "Cargando..." : error ? "Error" : "Salida de caja chica no encontrada"} handleSubmit={handleSubmit} >
          <InputForm
            label="Nombre completo"
            name="fullName"
            value={fullName}
            type="text"
            onChange={(e) => setFullName(e.target.value)}
          />
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
          <InputForm
            label="Dirección"
            name="address"
            value={address}
            type="text"
            onChange={(e) => setAddress(e.target.value)}
            optional={true}
          />

          {workerGroupsLoading ? (
            <p>Cargando grupos de trabajadores...</p>
          ) : workerGroupsError ? (
            <p>Error al cargar los grupos de trabajadores</p>
          ) : (
            <SelectForm
              label="Grupo de Trabajadores"
              name="workerGroupId"
              value={workerGroupId}
              options={workerGroupOptions}
              onChange={(value) => setWorkerGroupId(value)}
            />
          )}

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
