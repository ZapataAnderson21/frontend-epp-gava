import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import SeeButton from "../../common/button/SeeButton";
import { Table } from "../../common/table";
import { userApi } from "../../data/apiUrl";
import type { User } from "../../data/types";
import { useFetch } from "../../hooks";
import { useNavigate } from "react-router-dom";

export default function UserTable() {

  const { data: users, loading, error } = useFetch<User[]>(userApi)

  const navigate = useNavigate();

  const columns = [
    { label: "Nombre", width: "16rem", render : (user: User) => `${user.name} ${user.lastName}` },
    { key: "email", label: "Correo", width: "16rem" },
    { key: "userType", label: "Rol", width: "20rem" },
    { label: "Acciones", 
      width: "6rem",  
      render: (user: User) => (
        <SeeButton onClick={() => navigate(`/admin/users/${user.userId}`)} />
      )
    },
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
