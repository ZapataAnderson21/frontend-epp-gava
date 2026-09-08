import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { SaveButton } from "../../common/button";
import ReturnButton from "../../common/button/ReturnButton";
import ErrorWithButton from "../../common/error/ErrorWithButton";
import {
  ButtonContainer,
  Form,
  InputForm,
  SelectForm,
} from "../../common/form";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import { userApi, userTypeApi } from "../../data/apiUrl";
import type { UpdateUserDto, UserType } from "../../data/types";
import { useApiAction } from "../../hooks/useApiAction";
import { useFetch } from "../../hooks/useFetch";
import { permissionsApi, useAccess } from "../../permissions/AccessProvider";

export default function User() {
  const { can, refresh } = useAccess();
  const userId = Number(window.location.pathname.split("/").pop());

  // Campos controlados del form
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const navigate = useNavigate();

  const {
    data: user,
    loading: loadingUser,
    error: errorUser,
  } = useFetch<{
    name: string;
    lastName: string;
    email: string;
    userType: string;
  }>(`${userApi}${userId}`, [userId]);

  const {
    data: userTypes,
    loading: loadingRoles,
    error: errorRoles,
  } = useFetch<UserType[]>(userTypeApi, []);

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
        </div>,
      );
      return;
    }

    const updatedData: UpdateUserDto = {
      name,
      lastName: lastname,
      email,
      password: password || undefined,
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
          const messages: string[] =
            typeof err.message === "string"
              ? err.message
                  .split(".,")
                  .map((msg: string) => msg.trim())
                  .filter((msg: string) => msg.length > 0)
              : [String(err.message)];
          messages.forEach((msg: string) => {
            toast.error(msg);
          });
          // Retorna string vacío para que el toast.promise no muestre un toast adicional
          return "";
        },
      },
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
        <fieldset
          disabled={!can("users.manage")}
          className="space-y-4 disabled:opacity-70"
        >
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
        </fieldset>
        {(() => {
          if (loadingRoles)
            return (
              <span className="text-xs text-gray-500">Cargando roles...</span>
            );

          if (errorRoles)
            return (
              <span className="text-xs text-red-500">
                Error al cargar los roles
              </span>
            );

          if (can("users.assignRole") && userTypes && userTypes.length > 0) {
            return (
              <SelectForm
                label="Rol"
                name="role"
                value={role}
                onChange={(value) => setRole(value.toString())}
                options={userTypes.map((role) => ({
                  value: role.name,
                  label: role.name,
                }))}
              />
            );
          }
          return null;
        })()}
        {can("users.assignRole") && (
          <button
            type="button"
            disabled={updating || role === user?.userType}
            className="w-fit rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            onClick={async () => {
              const selected = userTypes?.find((item) => item.name === role);
              if (
                !selected ||
                !window.confirm(`¿Asignar el rol ${role} a este usuario?`)
              )
                return;
              try {
                await updateUser(
                  `${permissionsApi}users/${userId}/role`,
                  "PUT",
                  { userTypeId: selected.userTypeId },
                );
                refresh();
                window.dispatchEvent(new Event("permissions-changed"));
                toast.success("Rol asignado correctamente.");
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "No se pudo asignar el rol.",
                );
              }
            }}
          >
            Aplicar cambio de rol
          </button>
        )}
        <ButtonContainer>
          <ReturnButton onClick={() => navigateToUsers()} />
          <SaveButton loading={updating} />
        </ButtonContainer>
      </Form>
      <Toaster position="top-center" />
    </>
  );
}
