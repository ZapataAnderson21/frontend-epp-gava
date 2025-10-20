import { useNavigate } from "react-router-dom";
import { HeaderPanel, Panel } from "../../common/panel";
import SupplierTable from "./SupplierTable";
import AddButton from "../../common/button/AddButton";
import Permission from "../../common/auth/Permission";
import { logisticsTypes } from "../../utils";
import { useCurrentUser } from "../../hooks";
import { ErrorMessage } from "../../common/error";

export default function Suppliers() {
  const { user } = useCurrentUser();

  const navigate = useNavigate();
  return (
    <Permission user={user} allow={logisticsTypes} fallback={<ErrorMessage errorMessage="No tienes permisos para acceder a esta página." />}>
      <Panel>
        <HeaderPanel name={`PROVEEDORES`} >
            <AddButton onClick={() => navigate(`/admin/suppliers/new`)} />
        </HeaderPanel>

        <SupplierTable />
      </Panel>
    </Permission>
  );
}