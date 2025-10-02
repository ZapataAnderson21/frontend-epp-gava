import { FaPlus } from "react-icons/fa6";
import { Panel, HeaderPanel } from "../../common/panel";
import { Button } from "../../components";
import { useFetch } from "../../hooks";
import type { User } from "../../data/types";
import { userApi } from "../../data/apiUrl";
import { LoadingSkeletonTable } from "../../common/loading";
import { ErrorMessage } from "../../common/error";
import UserTable from "./UserTable";

export default function Users() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = ["GERENTE", "ADMINISTRADORA"].includes(user.userType);
  const { data: users, loading, error } = useFetch<User[]>(userApi)

  return (
    <Panel>
      <HeaderPanel name={`USUARIOS`}>
      { isManager && (
        <Button
          icon={<FaPlus />}
          label="Añadir"
          onClick={() => window.location.href = "/admin/users/new"}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
      )}
      </HeaderPanel>
      
      {loading && <LoadingSkeletonTable />}
      
      {error && <ErrorMessage errorMessage={error} />}

      {users && users.length === 0 && (
        <div className="text-gray-500">No hay usuarios disponibles.</div>
      )}

      { users && users.length > 0 &&
        <UserTable users={users} />
      }
    </Panel>
  );
}
