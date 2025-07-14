import { useEffect, useState } from "react";
import RedButton from "../../RedButton";
import { fetchCreateUser } from "../../data/userData";
import { fetchGetAllUserTypes, type ApiResponseGetAllUserTypes, type UserTypeResponse } from "../../data/userTypeData";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../SaveModal";

export default function NewUser() {

  const [name, setName] = useState<string>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").name : "");
  const [lastname, setLastname] = useState<string>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").lastname : "");
  const [email, setEmail] = useState<string>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").email : "");
  const [password, setPassword] = useState<string>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").password : "");
  const [userTypeId, setUserTypeId] = useState<number>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").userTypeId : 0);

  const [userTypes, setUserTypes] = useState<UserTypeResponse[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [openSaveModal, setOpenSaveModal] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetchCreateUser({
        name,
        last_name: lastname,
        email,
        password,
        user_type_id: userTypeId,
      });

      if (response.statusCode === 201) {
        localStorage.removeItem("newUserForm");
        setOpenSaveModal(true);
      }
      else {
        setError(response.message);
        console.error("Error creating user:", response.message);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Error creating user");
    }
  }

  useEffect(() => {
    localStorage.setItem("newUserForm", JSON.stringify({
      name,
      lastname,
      email,
      password,
      userTypeId
    }));
  }, [name, lastname, email, password, userTypeId]);

  useEffect(() => {
    const savedData = localStorage.getItem("newUserForm");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setName(parsed.name || "");
      setLastname(parsed.lastname || "");
      setEmail(parsed.email || "");
      setPassword(parsed.password || "");
      setUserTypeId(parsed.userTypeId || 0);
    }

    const fetchUserTypes = async () => {
      try {
        const response = await fetchGetAllUserTypes() as ApiResponseGetAllUserTypes;
        if (response.statusCode === 200) {
          setUserTypes(response.data);
        } else {
          console.error("Error fetching user types:", response.message);
        }
      } catch (error) {
        console.error("Error fetching user types:", error);
      }
    };

    fetchUserTypes();
  }, []);

  return (
    <>
      <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
          <h1 className="text-2xl font-bold mb-4">REGISTRAR USUARIO</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
          <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input type="text" id="name" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lastname" className="font-semibold">Apellido</label>
              <input type="text" id="lastname" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={lastname} onChange={(e) => setLastname(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-semibold">Correo</label>
              <input type="text" id="email" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-semibold">Contraseña</label>
              <input type="password" id="password" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-end justify-between"><label htmlFor="role" className="font-semibold">Rol</label><a href="/admin/users/role/new" className="text-[#0047a3] font-bold underline">Nuevo rol</a></div>
              <select name="userTypeId" id="userTypeId" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" value={userTypeId} onChange={(e) => setUserTypeId(Number(e.target.value))}>
                <option value="">Seleccione un rol</option>
                {userTypes.map((userType) => (
                  <option key={userType.user_type_id} value={userType.user_type_id}>
                    {userType.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
              <RedButton href="/admin/users" name="Cancelar" />
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Registrar</button>
            </div>
          </form>
        </div>
      </div>
      {
        openSaveModal && (
          <SaveModal onOk={() => navigate("/admin/users")} />
        )
      }
    </>
  );
}