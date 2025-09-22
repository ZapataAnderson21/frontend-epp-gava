import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Loading from "../common/loading";

interface SaveModalProps {
  onOk: () => void;
  message?: string;
  error?: boolean;
}

export default function SaveModal({ onOk, message, error }: SaveModalProps) {
  const [hidden, setHidden] = useState("hidden");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHidden("");
    setLoading(!loading);
  }, [error, message]);

  return (
    <div
      className={`${hidden} absolute z-20 inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-300`}
    >
      {loading ? (
        <Loading />
      ) : (
        <div className="flex items-center flex-col gap-4 bg-white p-6 m-8 rounded-lg shadow-lg w-full max-w-md text-black">
          { error ?
            (<FaTimesCircle className="w-16 h-16 text-red-500" />) : 
            (<FaCheckCircle className="w-16 h-16 text-[#003a80]" />)
          }
          <h1 className="text-2xl font-bold text-center">
            {message || "Error al guardar"}
          </h1>
          <button
            className={`${error ? "bg-red-500 hover:bg-red-600" : "bg-[#003a80] hover:bg-[#002d6b]"} text-white px-4 py-2 rounded-md transition-colors cursor-pointer`}
            onClick={onOk}
          >
            {error ? "Reintentar" : "Aceptar"}
          </button>
        </div>
      )}
    </div>
  );
}
