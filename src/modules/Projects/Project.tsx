import { useEffect, useState } from "react";
import RedButton from "../../RedButton";
import { useParams } from "react-router-dom";
import { fetchGetOne, fetchUpdateProject, fetchUpdateStatus, type UpdateProjectDto } from "../../data/projectData";
import { useNavigate } from "react-router-dom";

export default function Project() {

  const navigate = useNavigate();

  const { id: projectId } = useParams<{ id: string }>();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  let changeStatus: { label: string; value: string };

  if (status === "active") {
    changeStatus = {
      label: "INACTIVO",
      value: "inactive"
    }
  } else {
    changeStatus = {
      label: "ACTIVO",
      value: "active"
    };
  }

  useEffect(() => {
      const fetchData = async () => {
          const response = await fetchGetOne(Number(projectId));
          if (response) {
              setName(response.data.name);
              setCode(response.data.code);
              setDescription(response.data.description);
              setStatus(response.data.status);
          }
      };
      fetchData();
  }, [projectId]);

  const handleChangeStatus = () => {
    fetchUpdateStatus(Number(projectId), changeStatus.value)
      .then(response => {
        if (response.statusCode === 200) {
          navigate(0);
        } else {
          console.error("Error updating project status:", response.message);
        }
      })
      .catch(error => {
        console.error("Error updating project status:", error);
      });
  }

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();

      const updatedData: UpdateProjectDto = {
          name,
          description,
          code,
          status
      };
  
      try {
        const response = await fetchUpdateProject(Number(projectId), updatedData);

        if (response.statusCode === 200) {
          navigate("/admin/projects");
        } else {
          console.error("Error updating project:", response.message || "Unknown error");
        }
  
      } catch (error) {
        console.error("Error updating project:", error);
      }
    };
    

  return (
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">PROYECTO {projectId}</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
          <form className="flex flex-col gap-4 w-full max-w-md"  onSubmit={handleUpdate}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input type="text" id="name" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="font-semibold">Código</label>
              <input type="text" id="code" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="font-semibold">Descripción <span className="text-[10px] font-bold"> (opcional)</span></label>
              <textarea id="description" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between">
                <label htmlFor="status" className="font-semibold">Estado</label>
                <div className="flex flex-row items-end gap-1">
                  <span className="text-[12px] text-right">Cambiar estado a: </span> <span onClick={handleChangeStatus} className="text-[#0047a3] underline hover:scale-[101%] cursor-pointer font-bold">{changeStatus.label}</span>
                </div>
              </div>
              <input type="text" id="status" className="border border-gray-400 p-2 rounded-sm" value={status === "active" ? "ACTIVO" : "INACTIVO"} disabled />
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/projects" name="Regresar" />
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Actualizar</button>
            </div>
          </form>
        </div>
      </div>
    );
}
