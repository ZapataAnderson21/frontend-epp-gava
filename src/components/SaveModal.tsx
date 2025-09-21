import { FaCheckCircle } from "react-icons/fa";

interface SaveModalProps {
  onOk: () => void;
  message?: string;
  loading?: boolean;
}

export default function SaveModal({ onOk, message, loading }: SaveModalProps) {

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center">
        <div className="flex items-center justify-center w-full h-full">
          <img className="h-32" src="/loading.gif" alt="Loading..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center">
      <div className="flex items-center flex-col gap-4 bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-[#003a80]">
        <FaCheckCircle className="w-16 h-16" />
        <h1 className="text-2xl font-bold">{message || "Registro Exitoso"}</h1>
        <button
          className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003a80] transition-colors cursor-pointer"
          onClick={onOk}
        >
          OK
        </button>
      </div>
    </div>
  );
}
