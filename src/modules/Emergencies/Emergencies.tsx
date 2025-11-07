import { ReturnButton } from "../../common/button";
import AddButton from "../../common/button/AddButton";
import { HeaderPanel, Panel } from "../../common/panel";
import EmergencyTable from "./EmergencyTable";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Emergencies() {

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const navigate = useNavigate();

  const navigateToNewProject = () => {
    if (projectId) {
      navigate(`/admin/emergencies/new?projectId=${projectId}`);
    } else {
      navigate(`/admin/emergencies/new`);
    }
  };

  return (
    <Panel>
      <HeaderPanel name={`EMERGENCIAS`}>
        <AddButton onClick={navigateToNewProject} />
        { projectId && <ReturnButton onClick={() => navigate(`/admin/projects/${projectId}`)} /> }
      </HeaderPanel>
      
      <EmergencyTable />
    </Panel> 
  )
}