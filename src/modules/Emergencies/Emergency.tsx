import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { emergencyApi } from "../../data/apiUrl";
import type { User, ProjectType } from "../../data/types";
import Loading from "../../common/loading/Loading";
import ErrorMessage from "../../common/error/ErrorMessage";
import { ButtonContainer } from "../../common/form";
import ReturnButton from "../../common/button/ReturnButton";

interface EmergencyType {
  emergency_id: number;
  title: string;
  description: string;
  status: string;
  project?: ProjectType;
  user?: User;
  image: string;
}

const EmergencyStatus: Record<string, string> = {
  "pending" : "Pendiente",
  "addressed" : "Atendida",
  "rejected" : "Rechazada"
}

export default function Emergency() {
  const { id: emergencyId } = useParams<{ id: string }>();

  const { data: emergency, loading, error } = useFetch<EmergencyType>(`${emergencyApi}${emergencyId}`, [emergencyId]);

  const { execute: updateEmergency, loading: updating } = useApiAction<EmergencyType>();

  const [status, setStatus] = useState("active");

  const [imageUrl, setImageUrl] = useState("");

  const navigate = useNavigate();

  const navigateToEmergencies = () => {
    navigate("/admin/emergencies");
  };

  useEffect(() => {
    if (emergency) {
      setStatus(emergency.status);
      if (emergency.image) {
        fetch(`${emergencyApi}image/${emergency.image}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
          }
        })
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        });
      }
    
    }
  }, [emergency]);

  const handleChangeStatus = (status: string) => {
    updateEmergency(`${emergencyApi}${emergencyId}`, "PATCH", {
      status,
    }).then((res) => {
      if (res?.statusCode === 200) {
        setStatus(status);
      } else {
        console.error("Error actualizando emergencia:", res?.message);
      }
    });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!emergency) return <ErrorMessage errorMessage="Emergencia no encontrada." />;

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
        <h1 className="text-2xl font-bold mb-4">EMERGENCIA {emergencyId}</h1>
      </div>
      <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-gray-600">
        <div className="flex flex-row flex-wrap gap-4 w-full">
          <div className="flex flex-col gap-4 w-full max-w-fit border-r border-gray-200 pr-8">
            <p><strong>Título:</strong> {emergency.title}</p>
            <p><strong>Descripción:</strong> {emergency.description}</p>
            <p><strong>Proyecto:</strong> {emergency.project?.name || "N/A"}</p>
            <p><strong>Usuario:</strong> {emergency.user?.name || "N/A"}</p>
            <p><strong>Estado:</strong> {EmergencyStatus[status]}</p>
          </div>
            {imageUrl && (
            <img 
              className="w-auto h-full max-h-72 cursor-pointer hover:opacity-80 transition-opacity" 
              src={imageUrl} 
              alt={`Evidencia de emergencia ${emergencyId}.`}
              onClick={() => window.open(imageUrl, '_blank')}
            />
            )}
        </div>
        <ButtonContainer>
          <ReturnButton onClick={() => navigateToEmergencies()} />
          {
            status === "pending" && (
              <>
                <button
                  onClick={() => handleChangeStatus("addressed")}
                  disabled={updating}
                  className="w-fit bg-[#0047a3] px-3 py-2 rounded-md shadow-sm hover:bg-[#003a80] 
                            transition-colors cursor-pointer"
                >
                  {updating ? "Actualizando..." : "Atender"}
                </button>
                <button
                  onClick={() => handleChangeStatus("rejected")}
                  disabled={updating}
                  className="w-fit bg-[#d97706] px-3 py-2 rounded-md shadow-sm hover:bg-[#b45309] 
                            transition-colors cursor-pointer"
                >
                  {updating ? "Actualizando..." : "Rechazar"}
                </button>
              </>
            )
          }
        </ButtonContainer>
      </div>
    </div>
  );
}
