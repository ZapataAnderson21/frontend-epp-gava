import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { userApi } from "../../data/apiUrl";
import type { User } from "../../data/types";
import { useFetch } from "../../hooks";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../hooks";
import { adminTypes } from "../../utils";
import { DeleteButton, EditButton } from "../../common/button";
import { useApiAction } from "../../hooks/useApiAction";
import toast, { Toaster } from "react-hot-toast";

interface UserTableProps {
  showInactive?: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const isReleasedEmail = (email: string) =>
  email.includes("+inactivo-") && email.endsWith("@disabled.local");

export default function UserTable({ showInactive = false }: UserTableProps) {

  const { user } = useCurrentUser();

  let isAdmin: boolean = false;

  if(user) {
    isAdmin = adminTypes.includes(user.userType);
  }

  const { data: users, loading, error, refetch } = useFetch<User[]>(
    showInactive ? `${userApi}inactive` : userApi,
    [showInactive]
  )

  const { execute: disableUser, loading: disabling } = useApiAction<User>();

  const navigate = useNavigate();

  const handleDisable = async (selectedUser: User) => {
    const confirmed = window.confirm(
      `¿Deseas deshabilitar a ${selectedUser.name} ${selectedUser.lastName}? Sus registros históricos se conservarán y el correo quedará disponible para un nuevo usuario.`
    );

    if (!confirmed) return;

    await toast.promise(
      disableUser(`${userApi}${selectedUser.userId}`, "DELETE"),
      {
        loading: "Deshabilitando usuario...",
        success: (response) => {
          refetch();
          return response.message || "Usuario deshabilitado exitosamente.";
        },
        error: (err) => err.message || "No se pudo deshabilitar el usuario.",
      }
    );
  };

  const columns = [
    { label: "Nombre", width: "16rem", render : (user: User) => `${user.name} ${user.lastName}` },
    {
      label: "Correo",
      width: "16rem",
      render: (user: User) =>
        showInactive && isReleasedEmail(user.email) ? (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            Correo liberado
          </span>
        ) : (
          user.email
        ),
    },
    { key: "userType", label: "Rol", width: "20rem" },
    ...(showInactive ? [{
      label: "Inactivo desde",
      width: "12rem",
      render: (user: User) => formatDate(user.deletedAt),
    }] : []),
    ...(isAdmin && !showInactive ? [{ 
      label: "Acciones", 
      width: "10rem",  
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <EditButton onClick={() => navigate(`/admin/users/${user.userId}`)} />
          <DeleteButton
            onClick={() => handleDisable(user)}
            disabled={disabling}
          />
        </div>
      )
    }] : []),
  ] as const;

  if(loading) {
    return <LoadingSkeletonTable />;
  }

  if (error) {
    return <ErrorMessage errorMessage={error} />;
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-gray-500">
        {showInactive ? "No hay usuarios inactivos." : "No hay usuarios disponibles."}
      </div>
    );
  }

  return (
    <>
      <Table<User>
        data={users}
        columns={columns}
      />
      <Toaster position="top-center" />
    </>
  );
}
