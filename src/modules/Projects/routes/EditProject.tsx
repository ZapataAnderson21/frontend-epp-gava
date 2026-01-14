import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingSkeletonForm from "../../../common/loading/LoadingSkeletonForm";
import { projectApi } from "../../../data/apiUrl";
import { useFetch } from "../../../hooks/useFetch";
import { useApiAction } from "../../../hooks/useApiAction";
import type { Project } from "../../../data/types";
import ErrorWithButton from "../../../common/error/ErrorWithButton";
import { ButtonContainer, Form, InputForm, TextAreaForm } from "../../../common/form";
import { ReturnButton, SaveButton } from "../../../common/button";
import Permission from "../../../common/auth/Permission";
import { adminTypes } from "../../../utils";
import { useCurrentUser } from "../../../hooks";
import { ErrorMessage } from "../../../common/error";
import { toast, Toaster } from "react-hot-toast";

export default function EditProject() {
  const { user } = useCurrentUser();

  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, loading, error } = useFetch<Project>(`${projectApi}${projectId}`, [projectId]);
  const { execute: updateProject, loading: updating } = useApiAction<Project>();
  const { execute: updateStatus } = useApiAction<Project>();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setCode(project.code);
      setDescription(project.description ?? "");
      setLocation(project.location ?? "");
      setStartDate(project.startDate ? project.startDate.split('T')[0] : "");
      setEndDate(project.endDate ? project.endDate.split('T')[0] : "");

      const normalizedStatus = project.status === "Activo" ? "active" :
                               project.status === "Inactivo" ? "inactive" :
                               project.status;

      setStatus(normalizedStatus);
    }
  }, [project]);

  const changeStatus =
    status === "active"
      ? { label: "Inactivo", value: "inactive" }
      : { label: "Activo", value: "active" };

  const handleChangeStatus = () => {
    toast.promise(
      updateStatus(`${projectApi}${projectId}/status`, "PATCH", {
        status: changeStatus.value,
      }),
      {
        loading: 'Cambiando estado...',
        success: (result) => {
          setStatus(changeStatus.value);
          return result.message || `Estado cambiado a ${changeStatus.label}`;
        },
        error: (err) => err.message || 'Error al cambiar el estado',
      }
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    toast.promise(
      updateProject(`${projectApi}${projectId}`, "PATCH", {
        name,
        description,
        code,
        status,
        location,
        startDate: startDate ? new Date(startDate + 'T00:00:00.000Z').toISOString() : null,
        endDate: endDate ? new Date(endDate + 'T00:00:00.000Z').toISOString() : null,
      }),
      {
        loading: 'Actualizando proyecto...',
        success: (result) => {
          setTimeout(() => navigate("/admin/projects"), 1200);
          return result.message || 'Proyecto actualizado con éxito';
        },
        error: (err) => err.message || 'Error al actualizar el proyecto',
      }
    );
  };

  if (loading) {
    return <LoadingSkeletonForm numberRows={4} />;
  }

  if (error) {
    return (
      <ErrorWithButton errorMessage={error} href="/admin/projects" />
    );
  }

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
      <Form name={`PROYECTO ${projectId}`} handleSubmit={handleUpdate}>
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

        <InputForm
          label="Estado"
          name="status"
          type="text"
          value={status === "active" ? "Activo" : "Inactivo"}
          onChange={() => {}}
          optional={false}
          disabled={true}
        >
          <div className="flex flex-row w-full justify-end items-end gap-1">
            <span className="text-[14px] text-right">Cambiar estado a: </span>
            <span
              onClick={handleChangeStatus}
              className="text-[#0047a3] underline hover:scale-[101%] cursor-pointer font-bold"
            >
              {changeStatus.label}
            </span>
          </div>
        </InputForm>
        
        <ButtonContainer>
          <ReturnButton onClick={() => navigate("/admin/projects")} />
          <SaveButton loading={updating} />
        </ButtonContainer>
      </Form>
    </Permission>
  );
}

