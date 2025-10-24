import { IoIosCloseCircle } from "react-icons/io";
import type { RequestWorker, Worker } from "../../../data/types";

interface RowRequestWorkerProps {
  requestWorker: RequestWorker;
  onRemove: (worker: Worker) => void;
  onChange: (
    workerId: number,
    field: keyof Pick<RequestWorker, "shirtSize" | "pantsSize" | "shoeSize">,
    value: string
  ) => void;
}

export default function RowRequestWorker({ requestWorker, onRemove, onChange }: RowRequestWorkerProps) {
  const worker = requestWorker.worker!;
  return (
    <div className="flex flex-row items-center justify-between w-full p-2 border-b border-gray-200 gap-4 hover:rounded-lg hover:bg-[#eff2ff]">
      <span className="flex items-start justify-start w-48">{worker.fullName}</span>

      <input
        type="text"
        className="flex items-start justify-start w-28 border border-gray-300 rounded-md px-2 py-1"
        placeholder="Camisa"
        value={requestWorker.shirtSize ?? ""}
        onChange={(e) => onChange(worker.workerId!, "shirtSize", e.target.value)}
      />

      <input
        type="text"
        className="flex items-start justify-start w-28 border border-gray-300 rounded-md px-2 py-1"
        placeholder="Pantalón"
        value={requestWorker.pantsSize ?? ""}
        onChange={(e) => onChange(worker.workerId!, "pantsSize", e.target.value)}
      />

      <input
        type="text"
        className="flex items-start justify-start w-28 border border-gray-300 rounded-md px-2 py-1"
        placeholder="Calzado"
        value={requestWorker.shoeSize ?? ""}
        onChange={(e) => onChange(worker.workerId!, "shoeSize", e.target.value)}
      />

      <IoIosCloseCircle
        className="text-red-500 cursor-pointer size-6 hover:scale-115"
        onClick={() => onRemove(worker)}
      />
    </div>
  );
}
