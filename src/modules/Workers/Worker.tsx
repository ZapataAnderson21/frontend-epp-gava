import { useEffect, useState } from "react";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SaveModal, SelectForm } from "../../common/form";
import type { Option } from "../../common/form/SelectForm";
import { workerApi, workerGroupApi } from "../../data/apiUrl";
import type { Worker, WorkerGroup } from "../../data/types";
import { useApiAction, useFetch } from "../../hooks";
import { Button } from "../../components";
import { IoClose } from "react-icons/io5";

interface WorkerProps {
  workerId: number;
  successAction: () => void;
  closeAction: () => void;
}


export default function Worker({ workerId, successAction, closeAction }: WorkerProps) {

  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
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

    const body = { fullName, dni, phone, address, workerGroupId };
    
    const result = await execute(`${workerApi}${workerId}`, "PATCH", body);

    if (result.statusCode === 200) {
      successAction();

      // Limpia el formulario
      setFullName("");
      setDni("");
      setPhone("");
      setAddress("");
      setWorkerGroupId(0);
      setErrorDni("");
      setErrorPhone("");

      // Que el botón OK solo cierre el modal
      setOnOk(() => () => setOpenSaveModal(false));
    } else {
      setOnOk(() => () => setOpenSaveModal(false));
    }
  };

  useEffect(() => {
    if (worker) {
      setFullName(worker.fullName);
      setDni(worker.dni);
      setPhone(worker.phone ? worker.phone : "");
      setAddress(worker.address ? worker.address : "");
      setWorkerGroupId(worker.workerGroupId);
    }
  }, [worker]); 

  return (
    <>
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
          <Button
              icon={<IoClose className="text-xl" />}
              label="Cancelar"
              bgColor = "#d80027"
              bgHoverColor = "#c80008"
              onClick={closeAction}
            />
        </ButtonContainer>
      </Form>
      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={response?.message || saveError || "Error al guardar"}
          error={!!saveError || response?.statusCode !== 201}
        />
      )}
    </>
  );
}
