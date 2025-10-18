import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserType, UpdateUserDto } from "../../data/types";
import { userApi, userTypeApi } from "../../data/apiUrl";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import SaveModal from "../../common/form/SaveModal";
import ErrorWithButton from "../../common/error/ErrorWithButton";
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

  // Para modal de éxito/error
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

  const { data: user, loading: loadingUser, error: errorUser } = useFetch<{ name: string; last_name: string; email: string; userType: string }>(
    `${userApi}${userId}`,
    [userId]
  );

  const { data: userTypes, loading: loadingRoles, error: errorRoles } = useFetch<UserType[]>(userTypeApi, []);

  const { execute: updateUser, loading: updating } = useApiAction<any>();

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setOpenSaveModal(true);

    const updatedData: UpdateUserDto = {
      name,
      lastName: lastname,
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
        />
        <InputForm
          label="Nueva contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage} error={error} />
      )}
    </>
  );
}
