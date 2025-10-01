import { FaPlus } from "react-icons/fa6";
import ContentTable from "./components/ContentTable";
import { HeaderPanel, Panel } from "../../common/panel";
import { Button } from "../../components";

export default function Emergencies() {
  return (

    <Panel>
      <HeaderPanel name={`EMERGENCIAS`}>
        <Button
          icon={<FaPlus />}
          label="Añadir"
          onClick={() => window.location.href = "/admin/emergencies/new"}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
      </HeaderPanel>
      <ContentTable />
    </Panel> 
  )
}