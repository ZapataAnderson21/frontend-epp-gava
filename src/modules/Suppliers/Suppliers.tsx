import { FaPlus } from "react-icons/fa6";
import { HeaderPanel, Panel } from "../../common/panel";
import { Button } from "../../components";
import SupplierTable from "./SupplierTable";

export default function Suppliers() {
  return (
    <Panel>
      <HeaderPanel name={`PROVEEDORES`} >
        <Button
          icon={<FaPlus />}
          label="Añadir"
          href="/admin/suppliers/new"
          onClick={() => {}}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
      </HeaderPanel>

      <SupplierTable />

    </Panel>
  );
}