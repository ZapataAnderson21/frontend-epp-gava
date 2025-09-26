import { useEffect, useState } from "react";
import RedButton from "../../components/RedButton";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../components/SaveModal";
import LoadingSkeletonForm from "../../common/LoadingSkeletonForm";
import { getFetch, patchFetch } from "../../hooks/useFetch";
import { projectApi } from "../../data/apiUrl";

export default function Project() {

  const { id: projectId } = useParams<{ id: string }>();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(false);
  const [errorGet, setErrorGet] = useState(false);
  const [messageGet, setMessageGet] = useState("");
  const [error, setError] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

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
    setLoading(true);
    const fetchData = async () => {
      const response = await getFetch(projectApi + Number(projectId));

      if (response.statusCode !== 200) {
        setErrorGet(true);
        setMessageGet(response.message);
        setLoading(false);
      } else {
        setName(response.data.name);
        setCode(response.data.code);
        setDescription(response.data.description);
        setStatus(response.data.status);
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);
  
  const handleChangeStatus = async () => {
    const response = await patchFetch(projectApi + Number(projectId) + '/status', { status: changeStatus.value });
    
    if (response.statusCode === 200) {
      setStatus(changeStatus.value);
    }
  }

  const closeModalAndReset = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
  }

  const navigateToProjects = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
    navigate("/admin/projects");
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setOpenSaveModal(true);

    const updatedData = {
      name,
      description,
      code,
      status
    };

    const response = await patchFetch(projectApi + projectId, updatedData);

    setError(false);
    setSuccessMessage(response.message);

    if (response.statusCode !== 200) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setOnOk(() => () => navigateToProjects());
    }
  };

  if (loading) {
    return (
      <LoadingSkeletonForm numberRows={4} />
    );
  }

  if( errorGet ) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-800 p-10">
        <h1 className="mb-4">{messageGet}</h1>
        <div className="max-w-fit">
          <RedButton href="/admin/projects" name="Regresar" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
          <h1 className="text-2xl font-bold mb-4">PROYECTO {projectId}</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full">
          <form className="flex flex-col gap-4 w-full max-w-2xl"  onSubmit={handleUpdate}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input type="text" id="name" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="font-semibold">Código</label>
              <input type="text" id="code" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="font-semibold">Descripción <span className="text-[10px] font-bold"> (opcional)</span></label>
              <textarea id="description" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between">
                <label htmlFor="status" className="font-semibold">Estado</label>
                <div className="flex flex-row items-end gap-1">
                  <span className="text-[14px] text-right">Cambiar estado a: </span> <span onClick={handleChangeStatus} className="text-[#0047a3] underline hover:scale-[101%] cursor-pointer font-bold">{changeStatus.label}</span>
                </div>
              </div>
              <input type="text" id="status" className="border border-gray-400 p-3 rounded-sm" value={status === "active" ? "ACTIVO" : "INACTIVO"} disabled />
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/projects" name="Regresar" />
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Actualizar</button>
            </div>
          </form>
        </div>
      </div>
      {
        openSaveModal && (
          <SaveModal onOk={onOk} message={successMessage} error={error} />
        )
      }
    </>
  );
}
