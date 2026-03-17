import { useNavigate } from "react-router-dom";
import { AddButton } from "../../common/button";
import { HeaderPanel, Panel } from "../../common/panel";
import ClientTable from "./ClientTable";

export default function Clients() {
  const navigate = useNavigate();

  return (
    <Panel>
      <HeaderPanel name="CLIENTES">
        <AddButton onClick={() => navigate("/admin/clients/new")} />
      </HeaderPanel>

      <ClientTable />
    </Panel>
  );
}
