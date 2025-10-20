import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ReturnButton, SaveButton } from "../../common/button"
import SaveModal from "../../common/form/SaveModal";
import { useApiAction, useCurrentUser } from "../../hooks/";
import { projectApi } from "../../data/apiUrl";
import InputForm from "../../common/form/InputForm";
import TextAreaForm from "../../common/form/TextAreaForm";
import ButtonContainer from "../../common/form/ButtonContainer";
import { Form } from "../../common/form";
import { adminTypes } from "../../utils";
import Permission from "../../common/auth/Permission";
import { ErrorMessage } from "../../common/error";

interface Project {
  project_id: number;
  name: string;
  code: string;
  description?: string;
}

export default function NewProject() {
  const { user } = useCurrentUser();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");


  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();
  const { execute, loading, response, error } = useApiAction<Project>();

  const closeModalAndReset = () => { setOpenSaveModal(false); };
  const navigateToProjects = () => { navigate("/admin/projects"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSaveModal(true);

    const toIso = (d: string) => (d ? new Date(d + 'T00:00:00.000Z').toISOString() : undefined);

    const result = await execute(
      `${projectApi}`,
      "POST",
      { name, 
        code, 
        description, 
        location, 
        startDate: toIso(startDate), 
        endDate: toIso(endDate) 
      },
    );

    if (result.statusCode === 201) setOnOk(() => () => navigateToProjects());
    else setOnOk(() => () => closeModalAndReset());
  };

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permisos para acceder a esta página." />}>
      <Form name="REGISTRAR PROYECTO" handleSubmit={handleSubmit}>
        <InputForm
          label="Nombre"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          optional={false}
        />
        <InputForm
          label="Código"
          name="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          optional={false}
        />

        <InputForm
          label="Ubicación"
          name="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          optional={false}
        />

        <InputForm
          label="Fecha de inicio"
          name="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          optional={true}
        />

        <InputForm
          label="Fecha de fin"
          name="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          optional={true}
        />

        <TextAreaForm
          label="Descripción"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          optional={true}
        />

        <ButtonContainer>
          <ReturnButton onClick={() => navigateToProjects()} />
          <SaveButton loading={loading} />
        </ButtonContainer>
      </Form>

      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={response?.message || error || "Error al guardar"}
          error={!!error || response?.statusCode !== 201}
        />
      )}
    </Permission>
  );
}
