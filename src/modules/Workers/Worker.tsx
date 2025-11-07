import { IoCloseCircle } from "react-icons/io5";
import { ErrorMessage } from "../../common/error";
import { workerApi } from "../../data/apiUrl";
import type { Worker } from "../../data/types";
import { useFetch } from "../../hooks";
import { formatDate, formatDateTime } from "../../utils";

interface WorkerProps {
  workerId: number;
  closeAction: () => void;
}

export default function Worker({ workerId, closeAction }: WorkerProps) {

  const {data: worker, error, loading} = useFetch<Worker>(`${workerApi}${workerId}`);

  if (loading) return <div>Cargando...</div>;
  if (error) return <ErrorMessage errorMessage="Error al cargar el trabajador" />;

  return (
    <div className="relative bg-white rounded-xl w-xl p-8 text-gray-900 overflow-auto max-h-full">
      <h1 className="text-2xl font-extrabold mb-4">DETALLE DEL TRABAJADOR {worker?.workerId}</h1>

      <div className="flex flex-col gap-4 w-full max-w-2xl">
        <div className="flex flex-col w-full gap-4">
          <h2 className="text-xl font-bold">Información Personal</h2>
          <div className="flex flex-row gap-2">
            <label className="font-semibold text-nowrap">Nombre completo:</label>
            <span>{worker?.fullName}</span>
          </div>
          <div className="flex flex-row gap-2">
            <label className="font-semibold text-nowrap">DNI:</label>
            <span>{worker?.dni}</span>
          </div>
          <div className="flex flex-row gap-2">
            <label className="font-semibold text-nowrap">Fecha de nacimiento:</label>
            <span>{formatDate(worker?.birthDate)}</span>
          </div>
          <h2 className="text-xl font-bold mt-4">Información de contacto</h2>
          <div className="flex flex-row gap-2">
              <label className="font-semibold text-nowrap">Correo:</label>
              <span>{worker?.personalEmail}</span>
          </div>
          <div className="flex flex-row gap-2">
            <label className="font-semibold text-nowrap">Teléfono:</label>
            <span>{worker?.phone}</span>
          </div>
          <div className="flex flex-row gap-2">
            <label className="font-semibold text-nowrap">Dirección:</label>
            <span>{worker?.address}</span>
          </div>
          <h2 className="text-xl font-bold mt-4">Información laboral</h2>
          <div className="flex flex-row gap-2">
            <label className="font-semibold text-nowrap">Grupo de trabajador:</label>
            <span>{worker?.workerType[1]}</span>
          </div>
          <div className="flex flex-row gap-2">
            <label className="font-semibold text-nowrap">Fecha y hora de registro:</label>
            <span>{formatDateTime(worker?.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="absolute right-2 top-2">
        <IoCloseCircle className="size-8 aspect-square cursor-pointer" onClick={closeAction} />
      </div>
    </div>
  );
}
