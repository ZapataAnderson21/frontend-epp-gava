import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReturnButton, SaveButton } from "../../../common/button"
import { useApiAction, useCurrentUser } from "../../../hooks/";
import { projectApi } from "../../../data/apiUrl";
import InputForm from "../../../common/form/InputForm";
import TextAreaForm from "../../../common/form/TextAreaForm";
import ButtonContainer from "../../../common/form/ButtonContainer";
import { Form } from "../../../common/form";
import { adminTypes } from "../../../utils";
import Permission from "../../../common/auth/Permission";
import { ErrorMessage } from "../../../common/error";
import toast, { Toaster } from "react-hot-toast";

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

  const navigate = useNavigate();
  const { execute, loading} = useApiAction<Project>();

  const navigateToProjects = () => { navigate("/admin/projects"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toIso = (d: string) => (d ? new Date(d + 'T00:00:00.000Z').toISOString() : undefined);

    toast.promise(
      execute(
        `${projectApi}`,
        "POST",
        { 
          name, 
          code, 
          description, 
          location, 
          startDate: toIso(startDate), 
          endDate: toIso(endDate) 
        }
      ),
      {
        loading: 'Creando proyecto...',
        success: (result) => {
          setTimeout(() => navigateToProjects(), 1200);
          return result.message || 'Proyecto creado con éxito';
        },
        error: (err) => err.message || 'Error al crear el proyecto',
      }
    );
  };

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permisos para acceder a esta página." />}>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
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
    </Permission>
  );
}
