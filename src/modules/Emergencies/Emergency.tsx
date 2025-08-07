import { useEffect, useState } from "react";
import RedButton from "../../components/RedButton";
import { useParams } from "react-router-dom";
import { fetchGetEmergencyById, fetchUpdateEmergency } from "../../data/emergencyData";
import { useNavigate } from "react-router-dom";
import type { ProjectType } from "../../data/projectData";
import type { UserResponse } from "../../data/userData";

export default function Emergency() {

  const navigate = useNavigate();

  const { id: emergencyId } = useParams<{ id: string }>();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState<ProjectType | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState("");

  let changeStatus: { label: string; value: string };

  if (status === "active") {
    changeStatus = {
      label: "Atendido",
      value: "inactive"
    }
  } else {
    changeStatus = {
      label: "Pendiente",
      value: "active"
    };
  }

  useEffect(() => {
      const fetchData = async () => {
          const response = await fetchGetEmergencyById(Number(emergencyId));
          if (response) {
              setTitle(response.data.title);
              setDescription(response.data.description);
              if(response.data.project) {
                setProject(response.data.project);
              }
              if(response.data.user) {
                setUser(response.data.user);
              }
              setStatus(response.data.status);
          }
      };
      fetchData();
  }, [emergencyId]);

  const handleChangeStatus = () => {
    fetchUpdateEmergency(Number(emergencyId), { status: changeStatus.value })
      .then(response => {
        if (response.statusCode === 200) {
          navigate(0);
        } else {
          console.error("Error updating emergency status:", response.message);
        }
      })
      .catch(error => {
        console.error("Error updating emergency status:", error);
      });
  }    

  return (
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">EMERGENCIA {emergencyId}</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
          <div className="flex flex-col gap-4 w-full">
            <p><strong>Título:</strong> {title}</p>
            <p><strong>Descripción:</strong> {description}</p>
            <p><strong>Proyecto:</strong> {project ? project.name : "N/A"}</p>
            <p><strong>Usuario:</strong> {user ? user.name : "N/A"}</p>
            <p><strong>Estado:</strong> {status === "active" ? "Pendiente" : "Atendida"}</p>
          </div>
          <div className="flex flex-row items-center justify-center gap-4 mt-2 text-white font-semibold">
            <RedButton name="Regresar" href="/admin/emergencies" />
            <button
              onClick={handleChangeStatus} 
              className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] 
                        transition-colors cursor-pointer">
              {changeStatus.label}
            </button>
          </div>
        </div>
      </div>
    );
}
