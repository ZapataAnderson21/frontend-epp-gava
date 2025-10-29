import { Panel, HeaderPanel } from "../../common/panel";
import UserTable from "./UserTable";
import { useNavigate } from "react-router-dom";
import AddButton from "../../common/button/AddButton";
import { useCurrentUser } from "../../hooks";
import Permission from "../../common/auth/Permission";
import { adminTypes } from "../../utils";

export default function Users() {

  const { user } = useCurrentUser();

  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name={`USUARIOS`}>
        <Permission user={user} allow={adminTypes}>
          <AddButton onClick={() => navigate("/admin/users/new")} />
        </Permission>
      </HeaderPanel>

      <UserTable />

    </Panel>
  );
}
