import { Panel, HeaderPanel } from "../../common/panel";
import UserTable from "./UserTable";
import { useNavigate } from "react-router-dom";
import AddButton from "../../common/button/AddButton";

export default function Users() {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isManager = ["GERENTE", "ADMINISTRADORA"].includes(user.userType);

  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name={`USUARIOS`}>
      { isManager && (
        <AddButton onClick={() => navigate("/admin/users/new")} />
      )}
      </HeaderPanel>

      <UserTable />

    </Panel>
  );
}
