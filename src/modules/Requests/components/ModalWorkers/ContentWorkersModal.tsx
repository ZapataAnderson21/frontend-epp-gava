import { useApiAction, useFetch } from "../../../../hooks";
import type { Worker, RequestWorker } from "../../../../data/types";
import { requestWorkerApi, workerApi } from "../../../../data/apiUrl";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { LoadingSkeletonTable } from "../../../../common/loading";
import { FaDeleteLeft } from "react-icons/fa6";
import HeaderModal from "../ModalElements/HeaderModal";
import { BlueButton } from "../../../../components";

interface ContentWorkersModalProps {
  groupId: number;
  onSelected: (workers: Worker[], reqs: RequestWorker[]) => void;
  onClose: () => void;
}

export default function ContentWorkersModal({ groupId, onSelected, onClose }: ContentWorkersModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [originalIds, setOriginalIds] = useState<number[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [pages, setPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentWorkers = workers
    .filter((item) => item.fullName?.toLowerCase().includes(searchItem.toLowerCase()))
    .slice(indexOfFirstItem, indexOfLastItem);

  const { id } = useParams();
  const location = useLocation();
  const isNewRequest = location.pathname.endsWith("/new");

  // ✅ Hooks para API
  const {data: fetchedWorkers, error, loading} = useFetch<Worker[]>(`${workerApi}group/${groupId}`, [groupId]);
  const { data: fetchedRequestWorkers } = useFetch<RequestWorker[]>(id ? `${requestWorkerApi}request/${id}` : "", [id]);
  
  const { execute: createRequestWorker } = useApiAction<any>();
  const { execute: deleteRequestWorker } = useApiAction<any>();

  useEffect(() => {
    if (fetchedWorkers) {
      setWorkers(fetchedWorkers);
      setPages(Math.ceil(fetchedWorkers.length / itemsPerPage));
    }
  }, [fetchedWorkers]);

  useEffect(() => {
    if (isNewRequest) {
      const saved = localStorage.getItem("selectedWorkers");
      if (saved) {
        const parsed: Worker[] = JSON.parse(saved);
        setSelectedIds(
          parsed.map((item) => item.workerId).filter((id): id is number => id !== undefined)
        );
      }
    } else if (fetchedRequestWorkers) {
      const ids = fetchedRequestWorkers.map((er) => er.workerId);
      setSelectedIds(ids);
      setOriginalIds(ids);
    }
  }, [isNewRequest, fetchedRequestWorkers]);

  const handleCheckboxChange = ( workerId: number) => {
    if( workerId === undefined) return;
    setSelectedIds((prev) =>
      prev.includes( workerId) ? prev.filter((x) => x !==  workerId) : [...prev,  workerId]
    );
  };

  const handleSave = async () => {
    // 🧮 IDs seleccionados de este modal
    const selectedWorkersInThisModal = workers.filter(
      (w) => w.workerId !== undefined && selectedIds.includes(w.workerId)
    );

    if (isNewRequest) {
      // --------- NUEVO REQUERIMIENTO (localStorage + levantar estado) ----------

      // 1) Traer lo previamente guardado
      const prevWorkersRaw = localStorage.getItem("selectedWorkers");
      const prevReqWorkersRaw = localStorage.getItem("selectedRequestWorkers");
      const prevWorkers: Worker[] = prevWorkersRaw ? JSON.parse(prevWorkersRaw) : [];
      const prevReqWorkers: RequestWorker[] = prevReqWorkersRaw ? JSON.parse(prevReqWorkersRaw) : [];

      // 2) Evitar duplicar con lo ya guardado de **otros grupos**:
      //    - Quitamos del previo a los que pertenecen al grupo actual que estamos sobrescribiendo
      const currentGroupWorkerIds = new Set(workers.map((w) => w.workerId).filter(Boolean) as number[]);
      const filteredPrevReqWorkers = prevReqWorkers.filter((rw) => !currentGroupWorkerIds.has(rw.workerId));
      const filteredPrevWorkers = prevWorkers.filter((w) => !currentGroupWorkerIds.has(w.workerId!));

      // 3) Construir nuevos RequestWorker "básicos" para los elegidos en este modal
      const newReqWorkers: RequestWorker[] = selectedWorkersInThisModal.map((w) => ({
        // requestWorkerId aún no existe en "new", lo proveerá el backend al crear la Request
        requestWorkerId: 0, // opcional: placeholder
        requestId: 0,       // en "new" aún no hay ID real
        workerId: w.workerId!,
        shoeSize: null,
        pantsSize: null,
        shirtSize: null,
        worker: w,
      }));

      // 4) Resultado final (previo de otros grupos + nuevos de este grupo)
      const nextReqWorkers = [...filteredPrevReqWorkers, ...newReqWorkers];

      // A nivel de "Workers" simples, deduplicamos por workerId
      const nextWorkersMap = new Map<number, Worker>();
      [...filteredPrevWorkers, ...selectedWorkersInThisModal].forEach((w) => {
        if (w.workerId) nextWorkersMap.set(w.workerId, w);
      });
      const nextWorkers = Array.from(nextWorkersMap.values());

      // 5) Persistir y subir al padre
      localStorage.setItem("selectedWorkers", JSON.stringify(nextWorkers));
      localStorage.setItem("selectedRequestWorkers", JSON.stringify(nextReqWorkers));
      onSelected(nextWorkers, nextReqWorkers);

      // 6) Cerrar modal
      onClose();
      return;
    }

    // --------- EDICIÓN (hay requestId) ----------
    if (id) {
      const requestId = Number(id);

      // a) Calcular agregados y removidos
      const toAdd = selectedIds.filter((sid) => !originalIds.includes(sid));
      const toRemove = originalIds.filter((oid) => !selectedIds.includes(oid));

      // b) Crear los nuevos
      for (const workerId of toAdd) {
        await createRequestWorker(`${requestWorkerApi}`, "POST", {
          requestId,
          workerId,
          shoeSize: null,
          pantsSize: null,
          shirtSize: null,
        });
      }

      // c) Eliminar los removidos
      // necesitamos requestWorkerId -> viene en fetchedRequestWorkers
      // Nota: fetchedRequestWorkers ya lo tienes del useFetch arriba
      if (fetchedRequestWorkers && fetchedRequestWorkers.length) {
        for (const workerId of toRemove) {
          const rw = fetchedRequestWorkers.find((x) => x.workerId === workerId);
          if (rw?.requestWorkerId) {
            await deleteRequestWorker(`${requestWorkerApi}/${rw.requestWorkerId}`, "DELETE");
          }
        }
      }

      // d) Refrescar referencia local en el modal (opcional)
      setOriginalIds(selectedIds);

      // e) Cerrar modal
      onClose();
    }
  };


  if(loading) return <LoadingSkeletonTable />
  if(error) return <div className="flex items-center justify-center w-full h-full">{error}</div>

  return (
    <>
      <div className="px-3">
        <div className="flex flex-row items-center justify-between border border-gray-300 rounded-md px-2 py-1 w-full">
          <input
            type="text"
            className="outline-none size-full p-1"
            placeholder="Buscar por nombre..."
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
          />
          <FaDeleteLeft
            className="size-6 hover:scale-110 cursor-pointer"
            onClick={() => setSearchItem("")}
          />
        </div>
      </div>
      <HeaderModal />
      <div className="flex flex-col items-center justify-between w-full pt-4 px-6 gap-4 text-[14px] md:text-[16px]">
        {currentWorkers.map((worker) => (
          <div key={worker.workerId} className="flex items-center justify-between w-full">
            <span className="flex items-center justify-start w-12">{worker.workerId}</span>
            <span className="flex items-center justify-start w-full">{worker.fullName}</span>
            <input
              type="checkbox"
              className="p-2 size-4"
              checked={worker.workerId !== undefined && selectedIds.includes(worker.workerId)}
              onChange={() => handleCheckboxChange(worker.workerId)}
            />
          </div>
        ))}
        <div className="flex flex-row justify-end w-full font-bold mt-4 gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <div
              key={i}
              className={`flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer ${currentPage === i + 1 ? "bg-gray-300" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <BlueButton href="#" name="Guardar" onClick={handleSave} />
      </div>
    </>
  );
}