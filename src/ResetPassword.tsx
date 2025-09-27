import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "./data/apiUrl";
import { useApiAction } from "./hooks/useApiAction";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [openModal, setOpenModal] = useState(false);
  const [message, setMessage] = useState( "Ha ocurrido un error al actualizar su contraseña.");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const navigate = useNavigate();
  const { execute, loading } = useApiAction<any>();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !token) {
      setError("Por favor, completa todos los campos");
      return;
    }

    try {
      const result = await execute(
        `${userApi}reset-password`,
        "POST",
        { token, newPassword }
      );

      if (result.statusCode === 200) {
        setOpenModal(true);
        setError("");
        setMessage(
          "Tu contraseña ha sido actualizada correctamente. Puedes iniciar sesión con tu nueva contraseña."
        );
      } else {
        setMessage("Ocurrió un error al actualizar tu contraseña");
        setOpenModal(true);
        setError(result.message || "Ocurrió un error al actualizar tu contraseña");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado"
      );
      console.error("Reset password error:", err);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen sm:bg-gray-100">
        <div className="bg-white px-8 py-12 rounded-lg sm:shadow-md w-full max-w-md">
          <div className="flex flex-row items-center justify-center gap-4 w-full mb-8">
            <img src="/buho-gava.webp" alt="Logo-Buho" className="h-16" />
            <img src="/logo-gava.png" alt="Logo" className="h-16" />
          </div>
          <form onSubmit={handleResetPassword}>
            <div className="flex flex-col gap-2 items-start justify-center mb-6">
              <p className="text-gray-700 font-bold">Nueva Contraseña:</p>
              <input
                type="password"
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-[#0047a3]"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <div className="flex flex-row gap-4 items-end justify-between w-full">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003366] cursor-pointer hover:scale-[101%] font-bold disabled:opacity-50"
              >
                {loading ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {openModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
          <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">
              Actualización de contraseña
            </h2>
            <p className="text-gray-700 mb-4 text-center">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003366] cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
