import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import Loading from "../loading/Loading";
import { AnimatePresence, motion } from "framer-motion";

interface SaveModalProps {
  onOk: () => void;
  message?: string;
  error?: boolean;
}

export default function SaveModal({ onOk, message, error }: SaveModalProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Al cambiar message/error, mostramos el modal y aseguramos que NO quede en loading.
  useEffect(() => {
    setVisible(true);
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 150); // breve flash
    return () => clearTimeout(id);
  }, [error, message]);

  const handleOk = () => {
    // Animación de salida y luego ejecuta onOk
    setVisible(false);
    setTimeout(() => onOk(), 200); // igual al transition.duration del overlay
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}               // salida
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <Loading />
          ) : (
            <motion.div
              className="flex items-center flex-col gap-4 bg-white p-6 m-8 rounded-lg shadow-lg w-full max-w-md text-black"
              key="box"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }} // salida suave
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {error ? (
                <FaTimesCircle className="w-16 h-16 text-red-500" />
              ) : (
                <FaCheckCircle className="w-16 h-16 text-[#003a80]" />
              )}
              <h1 className="text-2xl text-center">
                {message || "Error al guardar"}
              </h1>
              <button
                className={`${
                  error
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-[#003a80] hover:bg-[#002d6b]"
                } text-white px-4 py-2 rounded-md transition-colors cursor-pointer`}
                onClick={handleOk}
              >
                {error ? "Reintentar" : "Aceptar"}
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
