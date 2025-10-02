import { Table } from "../../common/table";
import type { User } from "../../data/types";

export default function UserTable({ users }: { users: User[] }) {
  const columns = [
    { key: "name", label: "Nombre", width: "w-36" },
    { key: "last_name", label: "Apellido", width: "w-36" },
    { key: "email", label: "Correo", width: "w-48" },
    { key: "userType", label: "Rol", width: "w-144" },
  ] as const;

  return (
    <Table<User>
      data={users}
      columns={columns}
      getHref={(user) => `/admin/users/${user.user_id}`}
    />
  );
}
