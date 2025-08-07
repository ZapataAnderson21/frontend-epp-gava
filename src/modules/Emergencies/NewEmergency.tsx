import { useEffect, useState } from "react";
import RedButton from "../../components/RedButton";
import { fetchCreateEmergencyWithImage } from "../../data/emergencyData";
import { fetchGetByStatus } from "../../data/projectData";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../components/SaveModal";
import type { ProjectType } from "../../data/projectData";

export default function NewEmergency() {

  const [image, setImage] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [projectId, setProjectId] = useState<number>(0);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [projects, setProjects] = useState<ProjectType[]>([]);

  const [openSaveModal, setOpenSaveModal] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await fetchGetByStatus("active");
      if (response.statusCode === 200) {
        setProjects(response.data);
      }
    };

    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    if (image) {
      formData.append("image", image);
    }
    formData.append("title", title);
    formData.append("description", description);
    formData.append("user_id", user.user_id);
    formData.append("project_id", projectId.toString());

    try {
      const result = await fetchCreateEmergencyWithImage(formData);

      if (result.statusCode === 201) {
        setOpenSaveModal(true);
      } else {
        console.error("Error:", result.message);
      }
    } catch (error) {
      console.error("Error creating emergency:", error);
    }
  };


  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">REGISTRAR EMERGENCIA</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
          <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="font-semibold">Asunto</label>
              <input type="text" id="title" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="font-semibold">Descripción</label>
              <textarea id="description" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="project" className="font-semibold">Proyecto</label>
              <select
                className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-full mb-3"
                value={projectId}
                onChange={(e) => {
                  setProjectId(Number(e.target.value));
                  localStorage.setItem("projectId", e.target.value);
                }}>
                <option value={0} disabled>Selecciona un proyecto</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="image" className="font-semibold">Imagen</label>
              <input 
                type="file" id="image" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImage(e.target.files[0]);
                  }
                }} 
              />
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/emergencies" name="Cancelar" />
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Registrar</button>
            </div>
          </form>
        </div>
      </div>
      {
        openSaveModal && (
          <SaveModal onOk={() => navigate("/admin/emergencies")} />
        )
      }
    </>
  );
}