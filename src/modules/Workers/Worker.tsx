import { Download, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../../components/ActionButton";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { workClothingApi, workerApi } from "../../data/apiUrl";
import type { Worker, WorkClothingDelivery } from "../../data/types";
import getAuthHeaders from "../../hooks/getAuthHeaders";
import { useFetch } from "../../hooks";
import usePaginatedFetch from "../../hooks/usePaginatedFetch";

interface WorkerProps {
  workerId: number;
  closeAction: () => void;
}

const workerTypeLabels: Record<string, string> = {
  laborer: "Obrero",
  technician: "Técnico",
  engineer: "Ingeniero",
  administrator: "Administrador(a)",
  manager: "Gerente",
};

export default function WorkerDetail({ workerId, closeAction }: WorkerProps) {
  const navigate = useNavigate();
  const { data: worker, loading, error } = useFetch<Worker>(`${workerApi}${workerId}`);
  const history = usePaginatedFetch<WorkClothingDelivery>(
    `${workClothingApi}deliveries/worker/${workerId}`,
    { initialPageSize: 5 },
  );

  const downloadPdf = async (deliveryId: number) => {
    const response = await fetch(`${workClothingApi}deliveries/${deliveryId}/pdf`, {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `entrega-ropa-ER-${String(deliveryId).padStart(6, "0")}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error || !worker) return <ErrorMessage errorMessage={error || "Trabajador no encontrado."} />;

  const columns = [
    { label: "Fecha", render: (row: WorkClothingDelivery) => new Date(row.deliveredAt).toLocaleDateString("es-PE") },
    { label: "N.º", render: (row: WorkClothingDelivery) => `ER-${String(row.workClothingDeliveryId).padStart(6, "0")}` },
    { label: "Proyecto", render: (row: WorkClothingDelivery) => row.project.name },
    { label: "Responsable", render: (row: WorkClothingDelivery) => `${row.custodianUser.name} ${row.custodianUser.lastName}` },
    { label: "Prendas", render: (row: WorkClothingDelivery) => row.items.map((item) => `${item.elementNameSnapshot} talla ${item.variantLabelSnapshot} × ${Number(item.quantity)}`).join(", ") },
    { label: "Estado", render: (row: WorkClothingDelivery) => row.status === "registered" ? "Registrada" : "Anulada" },
    { label: "Acciones", render: (row: WorkClothingDelivery) => <ActionButton icon={<Download />} label="Descargar constancia PDF" onClick={() => void downloadPdf(row.workClothingDeliveryId)} variant="ghost" permission="workClothing.export" /> },
  ] as const;

  return (
    <div className="relative flex h-full w-full flex-col overflow-auto bg-white p-6 text-gray-800">
      <button type="button" aria-label="Cerrar ficha del trabajador" onClick={closeAction} className="absolute right-4 top-4 rounded-md p-2 text-gray-500 hover:bg-blue-50 hover:text-[#0047a3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0047a3]"><X className="size-5" /></button>
      <div className="pr-12"><h1 className="text-xl font-bold">{worker.fullName}</h1><p className="mt-1 text-sm text-gray-500">DNI {worker.dni}</p></div>
      <div className="mt-5 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Tipo" value={workerTypeLabels[worker.workerType] || worker.workerType} />
        <Info label="Teléfono" value={worker.phone} />
        <Info label="Correo" value={worker.personalEmail} />
        <Info label="Dirección" value={worker.address} />
      </div>
      <section className="mt-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold">Historial de Ropa de Trabajo</h2><p className="text-sm text-gray-500">Las entregas históricas permanecen aunque cambie el proyecto o estado laboral.</p></div>
          <button type="button" onClick={() => navigate(`/admin/ssoma/work-clothing?workerId=${workerId}&tab=custody`)} className="inline-flex items-center gap-2 rounded-md bg-[#0047a3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00377f]"><Plus className="size-4" /> Nueva entrega</button>
        </div>
        {history.loading ? <LoadingSkeletonTable /> : history.error ? <ErrorMessage errorMessage={history.error} /> : history.items.length ? (
          <Table data={history.items} columns={columns} pagination={history.pagination} onPageChange={history.setPage} onPageSizeChange={history.setPageSize} />
        ) : <p className="rounded-md border border-dashed p-5 text-center text-sm text-gray-500">No existen entregas de ropa registradas.</p>}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return <div><span className="block text-xs font-semibold uppercase text-gray-500">{label}</span><span className="text-sm text-gray-900">{value || "No disponible"}</span></div>;
}
