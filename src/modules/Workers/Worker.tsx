import { IoCloseCircle } from "react-icons/io5";
import { ErrorMessage } from "../../common/error";
import { inventoryApi, workerApi } from "../../data/apiUrl";
import {
  WorkerType,
  type Worker,
  type WorkerInventoryAssignment,
  type WorkerInventoryHistoryResponse,
} from "../../data/types";
import { useFetch } from "../../hooks";
import { formatDateTime } from "../../utils";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { formatInventoryQuantity } from "../Elements/inventoryCatalog";

interface WorkerProps {
  workerId: number;
  closeAction: () => void;
}

export default function Worker({ workerId, closeAction }: WorkerProps) {
  const navigate = useNavigate();
  const today = new Date();
  const [familyFilter, setFamilyFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState(0);
  const [yearFilter, setYearFilter] = useState(today.getFullYear());

  const {data: worker, error, loading} = useFetch<Worker>(`${workerApi}${workerId}`);
  const historyUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (familyFilter) params.set("family", familyFilter);
    if (monthFilter) params.set("month", String(monthFilter));
    if (yearFilter) params.set("year", String(yearFilter));
    return `${inventoryApi}worker/${workerId}/history?${params.toString()}`;
  }, [familyFilter, monthFilter, workerId, yearFilter]);
  const { data: inventoryHistory } =
    useFetch<WorkerInventoryHistoryResponse>(historyUrl, [historyUrl]);

  // Función para obtener el nombre en español del tipo de trabajador
  const getWorkerTypeLabel = (workerType: string | undefined): string => {
    if (!workerType) return "No especificado";
    
    const typeEntry = Object.values(WorkerType).find(
      (type) => type[0] === workerType.toLowerCase()
    );
    
    return typeEntry ? typeEntry[1] : workerType;
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <ErrorMessage errorMessage="Error al cargar el trabajador" />;

  return (
    <div className="relative bg-white rounded-xl w-[min(1100px,95vw)] p-8 text-gray-900 overflow-auto max-h-full">
      <h1 className="text-2xl font-extrabold mb-4">DETALLE DEL TRABAJADOR {worker?.workerId}</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
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
            <span>{`${worker?.birthDate?.split("T")[0].split("-")[2]}/${worker?.birthDate?.split("T")[0].split("-")[1]}/${worker?.birthDate?.split("T")[0].split("-")[0]}`}</span>
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
            <span>{getWorkerTypeLabel(worker?.workerType)}</span>
          </div>
          <div className="flex flex-row gap-2">
            <label className="font-semibold text-nowrap">Fecha y hora de registro:</label>
            <span>{formatDateTime(worker?.createdAt)}</span>
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-[#0047a3] hover:bg-[#003366] text-white font-semibold"
              onClick={() => {
                closeAction();
                navigate(`/admin/worker-monthly-evaluations?workerId=${workerId}`);
              }}
            >
              Ver evaluaciones mensuales
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <h2 className="text-2xl font-extrabold">Historial de EP y EPA</h2>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold"
                value={familyFilter}
                onChange={(event) => setFamilyFilter(event.target.value)}
              >
                <option value="">Todos</option>
                <option value="epp">EPP</option>
                <option value="epi">EPI</option>
                <option value="uniform">Uniforme</option>
                <option value="harness">EPA</option>
              </select>
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold"
                value={monthFilter}
                onChange={(event) => setMonthFilter(Number(event.target.value))}
              >
                <option value={0}>Todos los meses</option>
                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <select
                className="rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold"
                value={yearFilter}
                onChange={(event) => setYearFilter(Number(event.target.value))}
              >
                {[0, 1, 2, 3].map((offset) => {
                  const value = today.getFullYear() - offset;
                  return <option key={value} value={value}>{value}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="w-fit rounded-lg border border-gray-200 bg-gray-100 p-4">
            <p className="text-sm font-bold text-gray-600">Cantidad total</p>
            <p className="text-4xl font-extrabold">
              {formatInventoryQuantity(inventoryHistory?.summary.totalQuantity ?? 0)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-gray-900">
                  <th className="py-2 pr-4">EP/EPA</th>
                  <th className="py-2 pr-4">Cant</th>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Obra</th>
                </tr>
              </thead>
              <tbody>
                {(inventoryHistory?.assignments ?? []).map((assignment: WorkerInventoryAssignment) => (
                  <tr key={assignment.workerInventoryAssignmentId} className="border-t border-gray-100">
                    <td className="py-3 pr-4 font-semibold">{assignment.elementName}</td>
                    <td className="py-3 pr-4">{formatInventoryQuantity(assignment.quantityAssigned)}</td>
                    <td className="py-3 pr-4">{assignment.assignedAt?.split("T")[0]?.split("-").reverse().join("/")}</td>
                    <td className="py-3 pr-4">{assignment.projectName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!inventoryHistory?.assignments?.length ? (
              <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                No hay entregas registradas con estos filtros.
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="absolute right-2 top-2">
        <IoCloseCircle className="size-8 aspect-square cursor-pointer" onClick={closeAction} />
      </div>
    </div>
  );
}
