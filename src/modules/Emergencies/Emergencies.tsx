import { FaArrowLeft, FaPlus } from "react-icons/fa6";
import { HeaderPanel, Panel } from "../../common/panel";
import { Button } from "../../components";
import EmergencyTable from "./EmergencyTable";
import { useSearchParams } from "react-router-dom";

export default function Emergencies() {

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  return (
    <Panel>
      <HeaderPanel name={`EMERGENCIAS`}>
        {projectId && (
          <Button
          icon={<FaArrowLeft />}
          label="Regresar"
          href={`/admin/projects/${projectId}`}
          bgColor="#d80027"
          bgHoverColor="#c80008"
          onClick={() => {}}
        />
        )}

        <Button
          icon={<FaPlus />}
          label="Añadir"
          href="/admin/emergencies/new"
          bgColor="#0047a3"
          bgHoverColor="#003a80"
          onClick={() => {}}
        />
      </HeaderPanel>
      
      <EmergencyTable />
    </Panel> 
  )
}