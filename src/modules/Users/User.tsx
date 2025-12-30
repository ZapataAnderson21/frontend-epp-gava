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

  const { execute: updateUser, loading: updating } = useApiAction<any>();

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
      password,
    };

    await toast.promise(
      updateUser(`${userApi}${userId}`, "PATCH", updatedData),
      {
        loading: "Actualizando usuario...",
        success: (response) => {
          setTimeout(() => navigateToUsers(), 1200);
          return response.message || "Usuario actualizado exitosamente";
        },
        error: (err) => err.message || "Error al actualizar usuario",
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
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          optional={true}
        />
        <InputForm
          label="Nueva contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          optional={true}
        />

        {loadingRoles && <span className="text-sm text-gray-500">Cargando roles...</span>}
        {errorRoles && <span className="text-sm text-red-500">Error al cargar los roles</span>}

        {!loadingRoles && !errorRoles && userTypes && (
          <SelectForm
            label="Rol"
            name="role"
            value={role}
            onChange={(value) => setRole(value.toString())}
            options={userTypes ? userTypes.map((role) => (
              { value: role.name, label: role.name }
            )) : []}
          />
        )}
        <ButtonContainer >
          <ReturnButton onClick={() => navigateToUsers()} />
          <SaveButton loading={updating} />
        </ButtonContainer>
      </Form>
      <Toaster position="top-center" />
    </>
  );
}
