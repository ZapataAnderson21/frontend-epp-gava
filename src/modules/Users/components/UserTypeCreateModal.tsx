import { useEffect, useRef, useState } from "react";
import { Form, InputForm, ButtonSubmit, ButtonContainer } from "../../../common/form";
import { useApiAction } from "../../../hooks/useApiAction";
import { userTypeApi } from "../../../data/apiUrl";
import { IoClose } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion"; // 👈 usa framer-motion, no motion/react

type CreatedUserType = { userTypeId: number; name: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (created: CreatedUserType) => void;
}

export default function UserTypeCreateModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const { execute, loading } = useApiAction<CreatedUserType>();

  // Cerrar con ESC o clic fuera
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { name: name.trim() };
    if (!payload.name) return;

    const res = await execute(userTypeApi, "POST", payload);

    if (res.statusCode === 201) {
      onCreated?.(res.data as CreatedUserType);
      setName("");
      onClose();
    } else {
      console.error(res.message);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} // ⬅️ animación de salida
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl p-4"
            key="box"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }} // ⬅️ animación de salida suave
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center justify-end w-full">
              <button
                onClick={onClose}
                className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                aria-label="Cerrar"
              >
                <IoClose />
              </button>
            </div>

            <Form name="Registrar un rol" handleSubmit={handleSubmit}>
              <InputForm
                label="Nombre"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                optional={false}
              />

              <ButtonContainer>
                <ButtonSubmit
                  label="Guardar"
                  loading={loading}
                  loadingLabel="Guardando..."
                />
              </ButtonContainer>
            </Form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
