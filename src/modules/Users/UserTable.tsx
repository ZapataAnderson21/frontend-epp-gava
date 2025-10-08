import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Table } from "../../common/table";
import { userApi } from "../../data/apiUrl";
import type { User } from "../../data/types";
import { useFetch } from "../../hooks";

export default function UserTable() {

  const { data: users, loading, error } = useFetch<User[]>(userApi)

  const columns = [
    { key: "name", label: "Nombre", width: "9rem" },
    { key: "lastName", label: "Apellido", width: "9rem" },
    { key: "email", label: "Correo", width: "16rem" },
    { key: "userType", label: "Rol", width: "20rem" },
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
      getHref={(user) => `/admin/users/${user.userId}`}
    />
  );
}
