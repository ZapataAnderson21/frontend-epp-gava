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

export default function Project() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, loading, error } = useFetch<ProjectType>(`${projectApi}${projectId}`, [projectId]);
  const { execute: updateProject, loading: updating, response, error: errorUpdate } = useApiAction<ProjectType>();
  const { execute: updateStatus } = useApiAction<ProjectType>();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
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
      setStatus(changeStatus.value); // reflejar en UI
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
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
          <h1 className="text-2xl font-bold mb-4">PROYECTO {projectId}</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full">
          <form
            className="flex flex-col gap-4 w-full max-w-2xl"
            onSubmit={handleUpdate}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="font-semibold">
                Código
              </label>
              <input
                type="text"
                id="code"
                className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="font-semibold">
                Descripción{" "}
                <span className="text-[10px] font-bold"> (opcional)</span>
              </label>
              <textarea
                id="description"
                className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between">
                <label htmlFor="status" className="font-semibold">
                  Estado
                </label>
                <div className="flex flex-row items-end gap-1">
                  <span className="text-[14px] text-right">Cambiar estado a: </span>
                  <span
                    onClick={handleChangeStatus}
                    className="text-[#0047a3] underline hover:scale-[101%] cursor-pointer font-bold"
                  >
                    {changeStatus.label}
                  </span>
                </div>
              </div>
              <input
                type="text"
                id="status"
                className="border border-gray-400 p-3 rounded-sm"
                value={status === "active" ? "ACTIVO" : "INACTIVO"}
                disabled
              />
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/projects" name="Regresar" />
              <button
                type="submit"
                disabled={updating}
                className="w-full bg-[#0047a3] px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer"
              >
                {updating ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </form>
        </div>
      </div>
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
