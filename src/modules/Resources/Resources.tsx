import { FaPlus } from "react-icons/fa6";
import { HeaderPanel, Panel } from "../../common/panel";
import { Button } from "../../components";
import ResourceTable from "./ResourceTable";

export default function Resources() {
  return (
    <Panel>
      <HeaderPanel name={`RECURSOS`} >
        <Button
          icon={<FaPlus />}
          label="Añadir"
          href="/admin/resources/new"
          onClick={() => {}}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
      </HeaderPanel>

      <ResourceTable />

    </Panel>
  );
}