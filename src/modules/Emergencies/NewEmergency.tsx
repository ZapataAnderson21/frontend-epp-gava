import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useFetch } from "../../hooks/useFetch";
import { useFormDataAction } from "../../hooks/useFormDataAction";
import { emergencyApi, projectApi } from "../../data/apiUrl";
import toast, { Toaster } from "react-hot-toast";

import type { Project } from "../../data/types";

import { ButtonContainer, Form, InputForm, SelectForm, TextAreaForm } from "../../common/form";
import { ReturnButton, SaveButton } from "../../common/button";

export default function NewEmergency() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get("projectId");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<number>(urlProjectId ? Number(urlProjectId) : 0);
  const [image, setImage] = useState<File | null>(null);

  const { data: projects, loading: loadingProjects, error: errorProjects } = useFetch<Project[]>(`${projectApi}status/active`);
  
  const { execute, loading } = useFormDataAction<any>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación
    const errors: string[] = [];
    if (!title.trim()) errors.push("El asunto es requerido");
    if (!description.trim()) errors.push("La descripción es requerida");
    if (projectId === 0) errors.push("Debe seleccionar un proyecto");

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

    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("userId", user.userId);
    formData.append("projectId", projectId.toString());

    await toast.promise(
      execute(emergencyApi, "POST", formData),
      {
        loading: "Registrando emergencia...",
        success: (result) => {
          setTimeout(() => navigateToEmergencies(), 1200);
          return result.message || "Emergencia registrada exitosamente";
        },
        error: (err) => err.message || "Error al registrar emergencia",
      }
    );
  };

  const navigateToEmergencies = () => {
    if (urlProjectId) {
      navigate(`/admin/projects/${urlProjectId}/emergencies`);
    } else {
      navigate("/admin/emergencies");
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
            options={projects ? projects.map((project) => ({ value: project.projectId, label: project.name })) : []}
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
          <ReturnButton onClick={() => navigateToEmergencies()} />
          <SaveButton loading={loading} />
        </ButtonContainer>
      </Form>
      <Toaster position="top-center" />
    </>
  );
}
