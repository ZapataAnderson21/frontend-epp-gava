import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserType, UpdateUserDto } from "../../data/types";
import { userApi, userTypeApi } from "../../data/apiUrl";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import ErrorWithButton from "../../common/error/ErrorWithButton";
import toast, { Toaster } from "react-hot-toast";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { ButtonContainer, Form, InputForm, SelectForm } from "../../common/form";
import ReturnButton from "../../common/button/ReturnButton";
import { SaveButton } from "../../common/button";

export default function User() {
  const userId = Number(window.location.pathname.split("/").pop());

  // Campos controlados del form
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const navigate = useNavigate();

  const { data: user, loading: loadingUser, error: errorUser } = useFetch<{ name: string; lastName: string; email: string; userType: string }>(
    `${userApi}${userId}`,
    [userId]
  );

  const { data: userTypes, loading: loadingRoles, error: errorRoles } = useFetch<UserType[]>(userTypeApi, []);

  const { execute: updateUser, loading: updating } = useApiAction<unknown>();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setLastname(user.lastName);
      setEmail(user.email);
      setRole(user.userType);
    }
  }, [user]);

  const navigateToUsers = () => {
    navigate("/admin/users");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación
    const errors: string[] = [];
    if (!name.trim()) errors.push("El nombre es requerido");
    if (!lastname.trim()) errors.push("El apellido es requerido");
    if (!email.trim()) errors.push("El correo es requerido");

    if (errors.length > 0) {
      toast.error(
        <div>
          <strong>Errores de validación:</strong>
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    const updatedData: UpdateUserDto = {
      name,
      lastName: lastname,
      email,
      password : password || undefined
    };

    await toast.promise(
      updateUser(`${userApi}${userId}`, "PATCH", updatedData),
      {
        loading: "Actualizando usuario...",
        success: (response) => {
          setTimeout(() => navigateToUsers(), 1200);
          return response.message || "Usuario actualizado exitosamente";
        },
        error: (err) => {
          // Separa los mensajes por punto y muestra cada uno en un toast diferente
          const messages: string[] = typeof err.message === "string"
            ? err.message.split(".,").map((msg: string) => msg.trim()).filter((msg: string) => msg.length > 0)
            : [String(err.message)];
          messages.forEach((msg: string) => {
            toast.error(msg);
          });
          // Retorna string vacío para que el toast.promise no muestre un toast adicional
          return "";
        },
      }
    );
  };

  if (loadingUser || loadingRoles) {
    return <LoadingSkeletonForm numberRows={5} />;
  }

  if (errorUser || errorRoles) {
    return (
      <ErrorWithButton
        errorMessage={errorUser || errorRoles || "Ocurrió un error"}
        href="/admin/users"
      />
    );
  }

  return (
    <>
      <Form name={`USUARIO ${userId}`} handleSubmit={handleUpdate}>
        
        <InputForm 
          label="Nombre"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <InputForm
          label="Apellido"
          name="lastname"
          type="text"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
        />
        <InputForm
          label="Correo"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputForm
          label="Nueva contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          optional={true}
        />

        {(() => {
          
          if (loadingRoles)  return <span className="text-xs text-gray-500">Cargando roles...</span>;
        
          if (errorRoles) return <span className="text-xs text-red-500">Error al cargar los roles</span>;

          if (userTypes && userTypes.length > 0) {
            return (
              <SelectForm
                label="Rol"
                name="role"
                value={role}
                onChange={(value) => setRole(value.toString())}
                options={userTypes.map((role) => ({ value: role.name, label: role.name }))}
              />
            );
          }
          return null;
        })()}
        <ButtonContainer >
          <ReturnButton onClick={() => navigateToUsers()} />
          <SaveButton loading={updating} />
        </ButtonContainer>
      </Form>
      <Toaster position="top-center" />
    </>
  );
}
