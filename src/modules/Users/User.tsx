import { useEffect, useState } from "react";
import RedButton from "../../components/RedButton";
import { fetchGetOne, fetchUpdateUser, type UpdateUserDto } from "../../data/userData";
import { useNavigate } from "react-router-dom";

export default function User() {

  const userId = Number(window.location.pathname.split('/').pop());

  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetchGetOne(userId);
        if (response.statusCode === 200 && response.data) {
          const userData = response.data.user;
          setName(userData.name);
          setLastname(userData.last_name);
          setEmail(userData.email);
          setRole(response.data.userType.name);
        } else {
          console.error("Error fetching user data:", response.message || "Unknown error");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    getUser();
  }, [userId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: UpdateUserDto = {
      name,
      last_name: lastname,
      email,
      password
    };

    try {
      const response = await fetchUpdateUser(userId, updatedData);
      
      if (response.statusCode === 200) {
        navigate("/admin/users");
      } else {
        console.error("Error updating user:", response.message || "Unknown error");
      }


    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
        <h1 className="text-2xl font-bold mb-4">USUARIO {userId}</h1>
      </div>
      <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
        <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleUpdate}>
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
            <input type="password" id="password" className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="font-semibold">Rol</label>
            <input type="text" id="role" className="border border-gray-400 p-2 rounded-sm" disabled value={role} />
          </div>
          <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
            <RedButton href="/admin/users" name="Regresar" />
            <button type="submit" className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer">Actualizar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
