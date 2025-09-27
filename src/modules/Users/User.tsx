import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RedButton from "../../components/RedButton";
import type { UserType, UpdateUserDto } from "../../data/types";
import { userApi, userTypeApi } from "../../data/apiUrl";
import LoadingSkeletonForm from "../../common/LoadingSkeletonForm";
import SaveModal from "../../components/SaveModal";
import ErrorWithButton from "../../common/ErrorWithButton";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";

export default function User() {
  const userId = Number(window.location.pathname.split("/").pop());

  // Campos controlados del form
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  // Para modal de éxito/error
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

  // 🔹 Traer info del usuario
  const { data: user, loading: loadingUser, error: errorUser } = useFetch<{ name: string; last_name: string; email: string; userType: string }>(
    `${userApi}/${userId}`,
    [userId]
  );

  // 🔹 Traer todos los userTypes
  const { data: userTypes, loading: loadingTypes, error: errorTypes } = useFetch<UserType[]>(userTypeApi, []);

  // 🔹 Hook para actualizar usuario
  const { execute: updateUser } = useApiAction<any>();

  // Cuando llega el usuario desde la API, setear campos en el form
  useEffect(() => {
    if (user) {
      setName(user.name);
      setLastname(user.last_name);
      setEmail(user.email);
      setRole(user.userType);
    }
  }, [user]);

  const closeModalAndReset = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
  };

  const navigateToUsers = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
    navigate("/admin/users");
  };

  // 🔹 Actualizar usuario
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setOpenSaveModal(true);

    const updatedData: UpdateUserDto = {
      name,
      last_name: lastname,
      email,
      password,
    };

    try {
      const res = await updateUser(`${userApi}/${userId}`, "PATCH", updatedData);

      setSuccessMessage(res.message);

      if (res.statusCode !== 200) {
        setError(true);
        setOnOk(() => () => closeModalAndReset());
      } else {
        setError(false);
        setOnOk(() => () => navigateToUsers());
      }
    } catch (err) {
      setError(true);
      setSuccessMessage("Error inesperado al actualizar el usuario");
      setOnOk(() => () => closeModalAndReset());
    }
  };

  // 🔹 Loading
  if (loadingUser || loadingTypes) {
    return <LoadingSkeletonForm numberRows={5} />;
  }

  // 🔹 Error
  if (errorUser || errorTypes) {
    return (
      <ErrorWithButton
        errorMessage={errorUser || errorTypes || "Ocurrió un error"}
        href="/admin/users"
      />
    );
  }

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">USUARIO {userId}</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
          <form className="flex flex-col gap-4 w-full max-w-2xl" onSubmit={handleUpdate}>
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
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="role" className="font-semibold">Rol</label>
              <select
                id="role"
                className="border border-gray-400 p-3 rounded-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {userTypes?.map((userType) => (
                  <option key={userType.user_type_id} value={userType.user_type_id}>
                    {userType.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/users" name="Regresar" />
              <button
                type="submit"
                className="w-full bg-[#0047a3] px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer"
              >
                Actualizar
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
