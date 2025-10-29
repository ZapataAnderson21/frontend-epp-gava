import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { userApi } from "../../data/apiUrl";
import type { User } from "../../data/types";
import { useFetch } from "../../hooks";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../hooks";
import { adminTypes } from "../../utils";
import { EditButton } from "../../common/button";

export default function UserTable() {

  const { user } = useCurrentUser();

  let isAdmin: boolean = false;

  if(user) {
    isAdmin = adminTypes.includes(user.userType);
  }

  const { data: users, loading, error } = useFetch<User[]>(userApi)

  const navigate = useNavigate();

  const columns = [
    { label: "Nombre", width: "16rem", render : (user: User) => `${user.name} ${user.lastName}` },
    { key: "email", label: "Correo", width: "16rem" },
    { key: "userType", label: "Rol", width: "20rem" },
    ...(isAdmin ? [{ 
      label: "Acciones", 
      width: "6rem",  
      render: (user: User) => (
        <EditButton onClick={() => navigate(`/admin/users/${user.userId}`)} />
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
    return <div className="text-gray-500">No hay usuarios disponibles.</div>;
  }

  return (
    <Table<User>
      data={users}
      columns={columns}
    />
  );
}
