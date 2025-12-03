import { HeaderPanel, Panel } from "../../common/panel";
import EmergencyTable from "./EmergencyTable";

export default function Emergencies() {

  return (
    <Panel>
      <HeaderPanel name={`EMERGENCIAS`} />
      
      <EmergencyTable />
    </Panel> 
  )
}