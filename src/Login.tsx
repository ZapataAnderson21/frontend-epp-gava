import { useState } from "react";
import { fetchLoginUser, fetchForgotPassword, type ApiResponseUserLogin } from "./data/userData";
import { useNavigate } from "react-router-dom";

export default function Login() { 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();


  const handleLogin = async (e: React.FormEvent) => { 
    e.preventDefault();
    if (!email || !password) { 
      setError("Por favor, completa todos los campos");
      return;
    } 
    
    const response = await fetchLoginUser(email, password);
    const responseData = await response.json();
    
    switch (responseData.statusCode) {
      case 200:
        const data = responseData.data as ApiResponseUserLogin;
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/admin");
        break;
      default:
        setError(responseData.message || "Error desconocido");
        break;
    }
    
    
  }; 
  
  const handleForgotPassword = async () => { 
    if (!email) { 
      setError("Por favor, ingresa tu correo electrónico"); 
      return; 
    } 
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) { 
      setError("Por favor, ingresa un correo electrónico válido");
      return; 
    } 
    
    const result = await fetchForgotPassword(email);
    
    if (result.statusCode === 200) { 
      setOpenModal(true); setError(null);
      setEmail("");
      setPassword("");
    } else { 
      console.error("Error sending forgot password email:", result.message || "Unknown error");
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
        <div className="flex flex-col gap-2 items-start justify-center mb-6">
          <p className="text-gray-700 font-bold">Correo:</p>
          <input type="text" className="border border-gray-300 p-2 rounded-md w-full focus:outline-[#0047a3]" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 items-start justify-center mb-6">
          <p className="text-gray-700 font-bold">Contraseña:</p>
          <input type="password" className="border border-gray-300 p-2 rounded-md w-full focus:outline-[#0047a3]" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div> 
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        </div>
        <div className="flex flex-row gap-4 items-end justify-between w-full">
          <button onClick={handleLogin} className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003366] cursor-pointer hover:scale-[101%] font-bold">Iniciar sesión</button>
          <a onClick={handleForgotPassword} className="text-[13px] text-[#0047a3] underline cursor-pointer hover:scale-[101%] hover:text-blue-800">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
    {openModal && ( 
      <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
        <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center">Recuperar contraseña</h2>
          <p className="text-gray-700 mb-4 text-center">Se ha enviado un correo electrónico a {email} con las instrucciones para recuperar tu contraseña.</p>
          <button onClick={() => setOpenModal(false)} className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003366] cursor-pointer">Cerrar</button>
        </div>
      </div>)
    }
  </>); 
}