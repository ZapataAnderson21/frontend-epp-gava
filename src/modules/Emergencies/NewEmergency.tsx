import { useState } from "react";
import RedButton from "../../common/form/RedButton";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../common/form/SaveModal";
import { emergencyApi, projectApi } from "../../data/apiUrl";
import { useFetch } from "../../hooks/useFetch";
import { useFormDataAction } from "../../hooks/useFormDataAction";
import type { ProjectType } from "../../data/types";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SelectForm, TextAreaForm } from "../../common/form";

export default function NewEmergency() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<number>(0);
  const [image, setImage] = useState<File | null>(null);

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const { data: projects, loading: loadingProjects, error: errorProjects } = useFetch<ProjectType[]>(`${projectApi}status/active`);
  
  const { execute, response, error, loading } = useFormDataAction<any>();

  const closeModalAndReset = () => {
    setOpenSaveModal(false);
  };

  const navigateToEmergencies = () => {
    navigate("/admin/emergencies");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSaveModal(true);

    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("user_id", user.user_id);
    formData.append("project_id", projectId.toString());

    const result = await execute(emergencyApi, "POST", formData);

    if (result.statusCode === 201) {
      setOnOk(() => () => navigateToEmergencies());
    } else {
      setOnOk(() => () => closeModalAndReset());
    }
  };

  return (
    <>
      <Form name="REGISTRAR EMERGENCIA" handleSubmit={handleSubmit}>
        <InputForm 
          label="Asunto"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          optional={false}
        />
        <TextAreaForm
          label="Descripción"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          optional={false}
        />
        {loadingProjects && <p>Cargando proyectos...</p>}
        {errorProjects && <p className="text-red-500">{errorProjects}</p>}
        {!loadingProjects && !errorProjects && (
          <SelectForm
            label="Proyecto"
            name="project"
            value={projectId}
            onChange={(value) => setProjectId(Number(value))}
            options={projects ? projects.map((project) => ({ value: project.project_id, label: project.name })) : []}
          />
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="image" className="font-semibold">
            Imagen
          </label>
          <input
            type="file"
            id="image"
            className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setImage(e.target.files[0]);
              }
            }}
          />
        </div>
        <ButtonContainer>
          <RedButton href="/admin/emergencies" name="Cancelar" />
          <ButtonSubmit label="Registrar" loadingLabel="Guardando..." loading={loading} />
        </ButtonContainer>
      </Form>

      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={response?.message || error || "Error al guardar"}
          error={!!error || response?.statusCode !== 201}
        />
      )}
    </>
  );
}
