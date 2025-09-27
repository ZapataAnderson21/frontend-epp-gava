import { useState } from "react";
import RedButton from "../../components/RedButton";
import { userApi } from "../../data/apiUrl";
import { userTypeApi } from "../../data/apiUrl";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../components/SaveModal";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import type { UserType } from "../../data/types";

interface UserResponse {
  user_id: number;
  name: string;
  last_name: string;
  email: string;
  user_type_id: number;
}

export default function NewUser() {
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userTypeId, setUserTypeId] = useState<number>(0);

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

  // 🔹 fetch roles
  const { data: userTypes, loading: loadingRoles, error: errorRoles } = useFetch<UserType[]>(userTypeApi);

  // 🔹 acción POST
  const { execute, loading: saving } = useApiAction<UserResponse>();

  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  };

  const navigateToUsers = () => {
    navigate("/admin/users");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOpenSaveModal(true);

    const payload = {
      name,
      last_name: lastname,
      email,
      password,
      user_type_id: userTypeId,
    };

    const response = await execute(userApi, "POST", payload);

    setSuccessMessage(response.message);

    if (response.statusCode !== 201) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setError(false);
      setOnOk(() => () => navigateToUsers());
    }
  };

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
          <h1 className="text-2xl font-bold mb-4">REGISTRAR USUARIO</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full">
          <form className="flex flex-col gap-4 w-full max-w-2xl" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input
                type="text"
                id="name"
                className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lastname" className="font-semibold">Apellido</label>
              <input
                type="text"
                id="lastname"
                className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-semibold">Correo</label>
              <input
                type="text"
                id="email"
                className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-semibold">Contraseña</label>
              <input
                type="password"
                id="password"
                className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-end justify-between">
                <label htmlFor="role" className="font-semibold">Rol</label>
                <a href="/admin/users/role/new" className="text-[#0047a3] font-bold underline">Nuevo rol</a>
              </div>
              <select
                id="userTypeId"
                className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
                value={userTypeId}
                onChange={(e) => setUserTypeId(Number(e.target.value))}
              >
                <option value="">Seleccione un rol</option>
                {userTypes?.map((userType) => (
                  <option key={userType.user_type_id} value={userType.user_type_id}>
                    {userType.name}
                  </option>
                ))}
              </select>
              {loadingRoles && <span className="text-sm text-gray-500">Cargando roles...</span>}
              {errorRoles && <span className="text-sm text-red-500">Error cargando roles</span>}
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/users" name="Cancelar" />
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#0047a3] px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage} error={error} />
      )}
    </>
  );
}
