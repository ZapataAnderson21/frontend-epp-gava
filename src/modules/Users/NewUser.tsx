import { useState } from "react";
import { userApi } from "../../data/apiUrl";
import { userTypeApi } from "../../data/apiUrl";
import { useNavigate } from "react-router-dom";
import { useFetch } from "../../hooks/useFetch";
import toast, { Toaster } from "react-hot-toast";
import { useApiAction } from "../../hooks/useApiAction";
import type { UserType } from "../../data/types";
import { ButtonContainer, Form, InputForm, SelectForm } from "../../common/form";
import UserTypeCreateModal from "./components/UserTypeCreateModal";
import ReturnButton from "../../common/button/ReturnButton";
import { SaveButton } from "../../common/button";
import { useCurrentUser } from "../../hooks";
import { adminTypes } from "../../utils";
import Permission from "../../common/auth/Permission";
import { ErrorMessage } from "../../common/error";

interface UserResponse {
  userId: number;
  name: string;
  lastName: string;
  email: string;
  userTypeId: number;
}

export default function NewUser() {
  const { user } = useCurrentUser();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userTypeId, setUserTypeId] = useState<number>(0);

  const [errorPassword, setErrorPassword] = useState("");
  const [errorPhone, setErrorPhone] = useState("");

  const [openUserTypesModal, setOpenUserTypesModal] = useState(false);

  const [reloadUserTypes, setReloadUserTypes] = useState(0);

  const navigate = useNavigate();

  // 🔹 fetch roles
    const { data: userTypes, loading: loadingRoles, error: errorRoles } = useFetch<UserType[]>(userTypeApi, [reloadUserTypes]);

  // 🔹 acción POST
  const { execute, loading: saving } = useApiAction<UserResponse>();

  const navigateToUsers = () => {
    navigate("/admin/users");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación
    const errors: string[] = [];
    if (!name.trim()) errors.push("El nombre es requerido");
    if (!lastName.trim()) errors.push("El apellido es requerido");
    if (!email.trim()) errors.push("El correo es requerido");
    if (!password.trim()) errors.push("La contraseña es requerida");
    if (userTypeId === 0) errors.push("Debe seleccionar un rol");
    if (phone.length !== 0 && phone.length !== 9) {
      errors.push("El teléfono debe tener exactamente 9 dígitos");
      setErrorPhone("El teléfono debe tener exactamente 9 dígitos");
    } else {
      setErrorPhone("");
    }
    if (password.length < 8) {
      errors.push("La contraseña debe tener al menos 8 caracteres");
      setErrorPassword("La contraseña debe tener al menos 8  caracteres");
    } else {
      setErrorPassword("");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("La contraseña debe contener al menos una mayúscula");
      setErrorPassword("La contraseña debe contener al menos una mayúscula, un número y un carácter especial");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("La contraseña debe contener al menos un número");
      setErrorPassword("La contraseña debe contener al menos una mayúscula, un número y un carácter especial");
    }
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      errors.push("La contraseña debe contener al menos un carácter especial");
      setErrorPassword("La contraseña debe contener al menos una mayúscula, un número y un carácter especial");
    }

    if (errors.length > 0) {
      // Mostrar cada error de validación en un toast separado
      errors.forEach((err: string, index: number) => {
        setTimeout(() => {
          toast.error(err, {
            duration: 4000,
          });
        }, index * 100); // Pequeño delay entre cada toast para que se vean en secuencia
      });
      return;
    }

    const payload = {
      name,
      lastName,
      email,
      ...(phone.trim() !== "" && { phone: phone }),
      password,
      userTypeId,
    };

    await toast.promise(
      execute(userApi, "POST", payload),
      {
        loading: "Creando usuario...",
        success: (response) => {
          setTimeout(() => navigateToUsers(), 1200);
          return response.message || "Usuario creado exitosamente";
        },
        error: (err) => err.message || "Error al crear usuario",
      }
    );
  };

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permisos para acceder a esta página." />}>
      <Form name="REGISTRAR USUARIO" handleSubmit={handleSubmit}>
        <InputForm label="Nombre" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} optional={false} />
        <InputForm label="Apellido" name="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} optional={false} />
        <InputForm label="Correo" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} optional={false} />
        <InputForm label="Teléfono" name="phone" type="text" value={phone} onChange={(e) => {setErrorPhone(""); const v = e.target.value; if (/^\d{0,9}$/.test(v)) setPhone(v); }} optional={true}  maxLength={9} error={errorPhone} />
        <InputForm label="Contraseña" name="password" type="password" value={password} onChange={(e) => { setErrorPassword(""); setPassword(e.target.value)}} optional={false} error={errorPassword} />
        
        {loadingRoles && 
          <div className="w-full flex flex-col items-start justify-center gap-4">
            <div className="h-8 bg-gray-300 rounded animate-pulse w-48"></div>
            <div className="h-8 bg-gray-300 rounded animate-pulse w-full"></div>
          </div>
        }
        {errorRoles && <span className="text-sm text-red-500">Error al cargar los roles</span>}
        
        {!loadingRoles && !errorRoles && userTypes && (
          <SelectForm
            label="Rol"
            name="role"
            value={userTypeId}
            onChange={(value) => setUserTypeId(Number(value))}
            options={userTypes ? userTypes.map((role) => ({ value: role.userTypeId, label: role.name })) : []}
          >
            <div className="text-[14px] font-bold underline cursor-pointer" onClick={() => setOpenUserTypesModal(true)}>¿Añadir un rol?</div>  
          </SelectForm>
        )}

        <ButtonContainer>
          <ReturnButton onClick={() => navigateToUsers()} />
          <Permission user={user} allow={adminTypes}>
            <SaveButton loading={saving} />
          </Permission>
        </ButtonContainer>
      </Form>

      <UserTypeCreateModal
        open={openUserTypesModal}
        onClose={() => setOpenUserTypesModal(false)}
        onCreated={(created) => {
          // 1) refrescar la lista
          setReloadUserTypes((n) => n + 1);
          // 2) opcional: seleccionar el nuevo rol
          if (created?.userTypeId) setUserTypeId(created.userTypeId);
        }}
      />

      <Toaster position="top-center" />
    </Permission>
  );
}
