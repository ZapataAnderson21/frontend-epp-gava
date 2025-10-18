import { useNavigate } from "react-router-dom";
import { HeaderPanel, Panel } from "../../common/panel";
import SupplierTable from "./SupplierTable";
import AddButton from "../../common/button/AddButton";

export default function Suppliers() {

  const navigate = useNavigate();
  return (
    <Panel>
      <HeaderPanel name={`PROVEEDORES`} >
        <AddButton onClick={() => navigate(`/admin/suppliers/new`)} />
      </HeaderPanel>

      <SupplierTable />

    </Panel>
  );
}