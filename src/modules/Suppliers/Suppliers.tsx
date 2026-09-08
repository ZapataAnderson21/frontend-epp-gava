import { useNavigate } from "react-router-dom";
import Permission from "../../common/auth/Permission";
import AddButton from "../../common/button/AddButton";
import { ErrorMessage } from "../../common/error";
import { HeaderPanel, Panel } from "../../common/panel";
import { useCurrentUser } from "../../hooks";
import SupplierTable from "./SupplierTable";

export default function Suppliers() {
  const { user } = useCurrentUser();

  const navigate = useNavigate();
  return (
    <Permission
      user={user}
      permission="suppliers.view"
      fallback={
        <ErrorMessage errorMessage="No tienes permisos para acceder a esta página." />
      }
    >
      <Panel>
        <HeaderPanel name={`PROVEEDORES`}>
          <AddButton onClick={() => navigate(`/admin/suppliers/new`)} />
        </HeaderPanel>

        <SupplierTable />
      </Panel>
    </Permission>
  );
}
