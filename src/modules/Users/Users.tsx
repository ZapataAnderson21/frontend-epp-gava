import { FaPlus } from "react-icons/fa6";
import { Panel, HeaderPanel } from "../../common/panel";
import { Button } from "../../components";
import UserTable from "./UserTable";

export default function Users() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = ["GERENTE", "ADMINISTRADORA"].includes(user.userType);

  return (
    <Panel>
      <HeaderPanel name={`USUARIOS`}>
      { isManager && (
        <Button
          icon={<FaPlus />}
          label="Añadir"
          href="/admin/users/new"
          onClick={() => {}}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
      )}
      </HeaderPanel>

      <UserTable />

    </Panel>
  );
}
