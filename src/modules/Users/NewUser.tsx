import { useState } from "react";
import { userApi } from "../../data/apiUrl";
import { userTypeApi } from "../../data/apiUrl";
import { useNavigate } from "react-router-dom";
import SaveModal from "../../common/form/SaveModal";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import type { UserType } from "../../data/types";
import { ButtonContainer, Form, InputForm, SelectForm } from "../../common/form";
import UserTypeCreateModal from "./components/UserTypeCreateModal";
import ReturnButton from "../../common/button/ReturnButton";
import { SaveButton } from "../../common/button";

interface UserResponse {
  userId: number;
  name: string;
  lastName: string;
  email: string;
  userTypeId: number;
}

export default function NewUser() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userTypeId, setUserTypeId] = useState<number>(0);

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const [openUserTypesModal, setOpenUserTypesModal] = useState(false);

  const [reloadUserTypes, setReloadUserTypes] = useState(0);

  const navigate = useNavigate();

  // 🔹 fetch roles
    const { data: userTypes, loading: loadingRoles, error: errorRoles } = useFetch<UserType[]>(userTypeApi, [reloadUserTypes]);

  // 🔹 acción POST
  const { execute, loading: saving } = useApiAction<UserResponse>();

  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  };

  const navigateToUsers = () => {
    navigate("/admin/users");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOpenSaveModal(true);

    const payload = {
      name,
      lastName,
      email,
      phone,
      password,
      userTypeId,
    };

    const response = await execute(userApi, "POST", payload);

    setSuccessMessage(response.message);

    if (response.statusCode !== 201) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setError(false);
      setOnOk(() => () => navigateToUsers());
    }
  };

  return (
    <>
      <Form name="REGISTRAR USUARIO" handleSubmit={handleSubmit}>
        <InputForm label="Nombre" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} optional={false} />
        <InputForm label="Apellido" name="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} optional={false} />
        <InputForm label="Correo" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} optional={false} />
        <InputForm label="Teléfono" name="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} optional={true} />
        <InputForm label="Contraseña" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} optional={false} />
        
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
          <p className="text-[14px] font-bold underline cursor-pointer" onClick={() => setOpenUserTypesModal(true)}>¿Añadir un rol?</p>  
          </SelectForm>
        )}

        <ButtonContainer>
          <ReturnButton onClick={() => navigateToUsers()} />
          <SaveButton loading={saving} />
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


      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage} error={error} />
      )}
    </>
  );
}
