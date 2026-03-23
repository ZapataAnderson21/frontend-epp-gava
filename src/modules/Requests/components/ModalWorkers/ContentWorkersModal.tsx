import { useApiAction, useFetch } from "../../../../hooks";
import type { Worker, RequestWorker } from "../../../../data/types";
import { requestWorkerApi, workerApi } from "../../../../data/apiUrl";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { LoadingSkeletonTable } from "../../../../common/loading";
import { FaDeleteLeft } from "react-icons/fa6";
import HeaderModal from "../ModalElements/HeaderModal";
import { Button } from "../../../../components";
import { FaSave } from "react-icons/fa";

interface ContentWorkersModalProps {
  workerType: string;
  onSelected: (workers: Worker[], reqs: RequestWorker[]) => void;
  onClose: () => void;
}

export default function ContentWorkersModal({ workerType, onSelected, onClose }: ContentWorkersModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [originalIds, setOriginalIds] = useState<number[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [pages, setPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentWorkers = useMemo(
    () =>
      workers
        .filter((w) => w.fullName?.toLowerCase().includes(searchItem.toLowerCase()))
        .slice(indexOfFirstItem, indexOfLastItem),
    [workers, searchItem, indexOfFirstItem, indexOfLastItem]
  );

  const { id } = useParams();
  const location = useLocation();
  const isNewRequest = location.pathname.endsWith("/new");

  // API
  const { data: fetchedWorkers, error, loading } = useFetch<Worker[]>(`${workerApi}type/${workerType}`, [workerType]);
  const { data: fetchedRequestWorkers } = useFetch<RequestWorker[]>(
    id ? `${requestWorkerApi}request/${id}` : "",
    [id]
  );

  const { execute: createRequestWorker } = useApiAction<RequestWorker>();
  const { execute: deleteRequestWorker } = useApiAction<{ requestWorkerId: number }>();

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
        // (opcional) podrías filtrar por group aquí también
        setSelectedIds(parsed.map((w) => w.workerId).filter(Boolean));
      }
    } else if (fetchedRequestWorkers) {
      // ⚠️ FILTRA por el grupo actual
      const ids = fetchedRequestWorkers
        .filter((rw) => rw.worker?.workerType === workerType)
        .map((rw) => rw.workerId);
      setSelectedIds(ids);
      setOriginalIds(ids);
    }
  }, [isNewRequest, fetchedRequestWorkers, workerType]);

  const handleCheckboxChange = (workerId: number) => {
    setSelectedIds((prev) => (prev.includes(workerId) ? prev.filter((x) => x !== workerId) : [...prev, workerId]));
  };

  const handleSave = async () => {
    const selectedWorkersInThisModal = workers.filter(
      (w) => w.workerId !== undefined && selectedIds.includes(w.workerId)
    );

    if (isNewRequest) {
      // ---------- NUEVA SOLICITUD ----------
      const prevWorkers: Worker[] = JSON.parse(localStorage.getItem("selectedWorkers") || "[]");
      const prevReqWorkers: RequestWorker[] = JSON.parse(localStorage.getItem("selectedRequestWorkers") || "[]");

      // quitar del previo los que pertenecen a este grupo (sobrescribimos este grupo)
      const currentGroupIds = new Set(workers.map((w) => w.workerId).filter(Boolean) as number[]);
      const keptPrevReqWorkers = prevReqWorkers.filter((rw) => !currentGroupIds.has(rw.workerId));
      const keptPrevWorkers = prevWorkers.filter((w) => !currentGroupIds.has(w.workerId));

      // preservar tallas si ya existían en prevReqWorkers (por workerId)
      const prevByWorker = new Map<number, RequestWorker>(keptPrevReqWorkers.map((rw) => [rw.workerId, rw]));

      const newReqWorkers: RequestWorker[] = selectedWorkersInThisModal.map((w) => {
        const prev = prevByWorker.get(w.workerId!); // preserva tallas si había
        return {
          requestWorkerId: prev?.requestWorkerId ?? 0,
          requestId: prev?.requestId ?? (isNewRequest ? 0 : Number(id)),
          workerId: w.workerId!,
          shoeSize: prev?.shoeSize ?? null,
          pantsSize: prev?.pantsSize ?? null,
          shirtSize: prev?.shirtSize ?? null,
          worker: w, // <-- ¡siempre setear!
        };
      });

      const nextReqWorkers = [...keptPrevReqWorkers, ...newReqWorkers];
      const nextWorkersMap = new Map<number, Worker>();
      [...keptPrevWorkers, ...selectedWorkersInThisModal].forEach((w) => nextWorkersMap.set(w.workerId, w));
      const nextWorkers = Array.from(nextWorkersMap.values());

      localStorage.setItem("selectedWorkers", JSON.stringify(nextWorkers));
      localStorage.setItem("selectedRequestWorkers", JSON.stringify(nextReqWorkers));

      onSelected(nextWorkers, nextReqWorkers);
      onClose();
      return;
    }

    // ---------- EDICIÓN ----------
    if (!id) return;
    const requestId = Number(id);

    const toAdd = selectedIds.filter((sid) => !originalIds.includes(sid));
    const toRemove = originalIds.filter((oid) => !selectedIds.includes(oid));

    // 1) Crear nuevos
    const createdResponses: RequestWorker[] = [];
    for (const workerId of toAdd) {

      const resp = await createRequestWorker(`${requestWorkerApi}`, "POST", {
        requestId,
        workerId,
        shoeSize: null,
        pantsSize: null,
        shirtSize: null,
      });

      if (resp?.data) {
        const w = workers.find((x) => x.workerId === workerId);
        createdResponses.push({
          ...(resp.data as RequestWorker),
          workerId,
          requestId,
          shoeSize: resp.data.shoeSize ?? null,
          pantsSize: resp.data.pantsSize ?? null,
          shirtSize: resp.data.shirtSize ?? null,
          worker: resp.data.worker ?? w,
        });
      } else {
        // fallback local por si el backend no trae data
        const w = workers.find((x) => x.workerId === workerId);
        createdResponses.push({
          requestWorkerId: 0, // se actualizará al próximo fetch, sirve para pintar de inmediato
          requestId,
          workerId,
          shoeSize: null,
          pantsSize: null,
          shirtSize: null,
          worker: w,
        });
      }
    }

    // 2) Eliminar removidos
    if (fetchedRequestWorkers) {
      for (const workerId of toRemove) {
        const rw = fetchedRequestWorkers.find((x) => x.workerId === workerId);
        if (rw?.requestWorkerId) {
          await deleteRequestWorker(`${requestWorkerApi}${rw.requestWorkerId}`, "DELETE"); // ojo: sin '/'
        }
      }
    }

    // 3) Reconstruir “nextReqWorkers”
    const keptExisting =
      (fetchedRequestWorkers || []).filter((rw) => !toRemove.includes(rw.workerId));

    const existingByWorker = new Map<number, RequestWorker>(
      keptExisting.map((rw) => [rw.workerId, rw])
    );

    // Unimos con los creados
    const merged = [...keptExisting];
    for (const created of createdResponses) {
      const already = existingByWorker.get(created.workerId);
      if (!already) merged.push(created);
    }

    // ✅ DEDUPE FINAL SIN FILTRAR POR selectedSet
    const nextReqWorkers = Array.from(
      new Map(merged.map((rw) => [rw.workerId, rw])).values()
    );

    // ✅ Workers para pintar: TODOS los resultantes
    const nextWorkers = nextReqWorkers
      .map((rw) => rw.worker)
      .filter((w): w is Worker => Boolean(w));

    // ✅ Enviar al padre arrays COMPLETOS (todos los grupos)
    onSelected(nextWorkers, nextReqWorkers);

    setOriginalIds(selectedIds);
    onClose();

  };

  if (loading) return <LoadingSkeletonTable />;
  if (error) return <div className="flex items-center justify-center w-full h-full">{error}</div>;

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
          <FaDeleteLeft className="size-6 hover:scale-110 cursor-pointer" onClick={() => setSearchItem("")} />
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
              checked={selectedIds.includes(worker.workerId)}
              onChange={() => handleCheckboxChange(worker.workerId)}
            />
          </div>
        ))}
        <div className="flex flex-row justify-end w-full font-bold mt-4 gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <div
              key={i}
              className={`flex items-center px-3 py-2 border-2 rounded-md hover:bg-gray-100 cursor-pointer ${
                currentPage === i + 1 ? "bg-gray-300" : ""
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <Button icon={<FaSave />} label="Guardar" type="button" bgColor="#0047a3" bgHoverColor="#003366" onClick={handleSave} />
      </div>
    </>
  );
}
