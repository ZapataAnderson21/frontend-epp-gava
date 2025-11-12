import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApiAction } from "../../hooks/useApiAction";
import { userApi } from "../../data/apiUrl";
import InputForm from "../../common/form/InputForm";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { Button } from "../../components";
import { AiOutlineLoading } from "react-icons/ai";
import { FiLogIn } from "react-icons/fi";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [openModal, setOpenModal] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);

  const navigate = useNavigate();
  
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectParam = params.get("redirect");

  const {
    execute: loginAction,
    loading: loadingLogin,
  } = useApiAction<LoginResponse>();

  const {
    execute: forgotAction,
    loading: loadingForgot,
  } = useApiAction<null>();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    const response = await loginAction(`${userApi}login`, "POST", {
      email,
      password,
    });

    if (response.statusCode === 200) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      const redirectTo = redirectParam && redirectParam !== "/" ? redirectParam : "/admin";

      navigate(redirectTo, { replace: true });
    } else {
      setError(response.message || "Error desconocido");
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

    const response = await forgotAction(`${userApi}forgot-password`, "POST", {
      email
    });

    if (response.statusCode === 200) {
      setOpenModal(true);
      setError("");
    } else {
      setError(response.message);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen sm:bg-gray-100">
        <form className="flex flex-col gap-4 bg-white px-8 py-12 rounded-lg sm:shadow-md w-full max-w-md" onSubmit={handleLogin}>
          <div className="flex flex-row items-center justify-center gap-4 w-full mb-8">
            <img src="/buho-gava.webp" alt="Logo-Buho" className="h-16" />
            <img src="/logo-gava.png" alt="Logo" className="h-16" />
          </div>

          <InputForm
            name="email"
            label="Correo:"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputForm 
            name="password"
            label="Contraseña:"
            type={visiblePassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          >
            <button
              type="button"
              onClick={() => setVisiblePassword(!visiblePassword)}
              className="cursor-pointer hover:scale-105 duration-300"
            >
              {visiblePassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </InputForm>

          <div className="flex flex-row gap-4 items-end justify-between w-full">
            <Button
              icon={loadingLogin ? <AiOutlineLoading className="animate-spin" /> : <FiLogIn />}
              label={loadingLogin ? "Ingresando..." : "Iniciar Sesión"}
              type="submit"
              bgColor="#0047a3" 
              bgHoverColor="#003366"
            />
            <a
              onClick={handleForgotPassword}
              className="text-[13px] text-[#0047a3] underline cursor-pointer hover:scale-[101%] hover:text-blue-800"
            >
              {loadingForgot ? "Enviando..." : "¿Olvidaste tu contraseña?"}
            </a>
          </div>
        </form>
      </div>

      {openModal && <ForgotPasswordModal email={email} onClick={() => setOpenModal(false)} />}
    </>
  );
}
