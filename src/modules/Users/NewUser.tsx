import { useEffect, useState } from "react";
import RedButton from "../../components/RedButton";
import { fetchCreateUser } from "../../data/userData";
import { fetchGetAllUserTypes, type UserType } from "../../data/userTypeData";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../components/SaveModal";

export default function NewUser() {

  const [name, setName] = useState<string>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").name : "");
  const [lastname, setLastname] = useState<string>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").lastname : "");
  const [email, setEmail] = useState<string>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").email : "");
  const [password, setPassword] = useState<string>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").password : "");
  const [userTypeId, setUserTypeId] = useState<number>(localStorage.getItem("newUserForm") ? JSON.parse(localStorage.getItem("newUserForm") || "{}").userTypeId : 0);

  const [userTypes, setUserTypes] = useState<UserType[]>([]);

  const [error, setError] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  }

  const navigateToUsers = () => {
    navigate("/admin/users");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name,
      last_name: lastname,
      email,
      password,
      user_type_id: userTypeId
    };

    const response = await fetchCreateUser(payload);
    const responseData = await response.json();

    setError(false);
    setSuccessMessage(responseData.message);

    if (responseData.statusCode !== 201) {
        setError(true);
        setOnOk(() => () => closeModalAndReset());
    }else {
        setOnOk(() => () => navigateToUsers());
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
        const response = await fetchGetAllUserTypes();
        const responseData = await response.json();

        if (responseData.statusCode === 200) {
          setUserTypes(responseData.data);
        } else {
          console.error("Error fetching user types:", responseData.message);
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
        <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
          <h1 className="text-2xl font-bold mb-4">REGISTRAR USUARIO</h1>
        </div>
        <div className="flex flex-col items-start justify-start gap-4 w-full h-full">
          <form className="flex flex-col gap-4 w-full max-w-2xl" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="font-semibold">Nombre</label>
              <input type="text" id="name" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lastname" className="font-semibold">Apellido</label>
              <input type="text" id="lastname" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={lastname} onChange={(e) => setLastname(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-semibold">Correo</label>
              <input type="text" id="email" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-semibold">Contraseña</label>
              <input type="password" id="password" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-end justify-between"><label htmlFor="role" className="font-semibold">Rol</label><a href="/admin/users/role/new" className="text-[#0047a3] font-bold underline">Nuevo rol</a></div>
              <select name="userTypeId" id="userTypeId" className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]" value={userTypeId} onChange={(e) => setUserTypeId(Number(e.target.value))}>
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
              <button type="submit" className="w-full bg-[#0047a3] px-4 py-3 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Registrar</button>
            </div>
          </form>
        </div>
      </div>
      {
        openSaveModal && (
          <SaveModal onOk={onOk} message={successMessage} error={error} />
        )
      }
    </>
  );
}