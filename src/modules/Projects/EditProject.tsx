import { useState, useEffect } from "react";
import RedButton from "../../common/form/RedButton";
import { useParams, useNavigate } from "react-router-dom";
import SaveModal from "../../common/form/SaveModal";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import { projectApi } from "../../data/apiUrl";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import type { ProjectType } from "../../data/types";
import ErrorWithButton from "../../common/error/ErrorWithButton";
import { ButtonContainer, ButtonSubmit, Form, InputForm, TextAreaForm } from "../../common/form";

export default function EditProject() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, loading, error } = useFetch<ProjectType>(`${projectApi}${projectId}`, [projectId]);
  const { execute: updateProject, loading: updating, response, error: errorUpdate } = useApiAction<ProjectType>();
  const { execute: updateStatus } = useApiAction<ProjectType>();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  useEffect(() => {
    if (project) {
      setName(project.name);
      setCode(project.code);
      setDescription(project.description ?? "");
      setStatus(project.status);
      setLocation(project.location ?? "");
      setStartDate(project.startDate ? project.startDate.split('T')[0] : "");
      setEndDate(project.endDate ? project.endDate.split('T')[0] : "");
    }
  }, [project]);

  const changeStatus =
    status === "active"
      ? { label: "INACTIVO", value: "inactive" }
      : { label: "ACTIVO", value: "active" };

  const handleChangeStatus = () => {
    updateStatus(`${projectApi}${projectId}/status`, "PATCH", {
      status: changeStatus.value,
    }).then(() => {
      setStatus(changeStatus.value);
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSaveModal(true);

    updateProject(`${projectApi}${projectId}`, "PATCH", {
      name,
      description,
      code,
      status,
      location,
      startDate: startDate ? new Date(startDate + 'T00:00:00.000Z').toISOString() : null,
      endDate: endDate ? new Date(endDate + 'T00:00:00.000Z').toISOString() : null,
    }).then((res) => {
      if (res?.statusCode === 200) {
        setOnOk(() => () => navigate("/admin/projects"));
      } else {
        setOnOk(() => () => setOpenSaveModal(false));
      }
    });
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
    <>
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
          value={status === "active" ? "ACTIVO" : "INACTIVO"}
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
          <RedButton 
            href="/admin/projects/"
            name="Regresar"
          />
          <ButtonSubmit 
            loading={updating}
            label="Actualizar"
            loadingLabel="Actualizando..."
          />
        </ButtonContainer>
      </Form>
        
      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={response?.message || ""}
          error={!!errorUpdate}
        />
      )}
    </>
  );
}

