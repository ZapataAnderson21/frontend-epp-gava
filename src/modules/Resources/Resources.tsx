import { HeaderPanel, Panel } from "../../common/panel";
import ResourceTable from "./ResourceTable";
import { useNavigate } from "react-router-dom";
import { AddButton } from "../../common/button";

export default function Resources() {
  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name={`RECURSOS`} >
        <AddButton onClick={() => navigate("/admin/resources/new")} />
      </HeaderPanel>

      <ResourceTable />

    </Panel>
  );
}