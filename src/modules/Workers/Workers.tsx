import { useEffect, useState } from "react";
import { HeaderPanel, Panel } from "../../common/panel";
import WorkerTable from "./WorkerTable";
import NewWorker from "./NewWorker";
import Worker from "./Worker";
import AddButton from "../../common/button/AddButton";
import { logisticsTypes } from "../../utils/userUtils";
import { useCurrentUser } from "../../hooks";
import Permission from "../../common/auth/Permission";
import EditWorker from "./Editworker";

export default function Workers() {
  const { user } = useCurrentUser();

  const [reFetch, setReFetch] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const successAction = () => { setReFetch(prev => prev + 1); }

  const handleSeeDetail = (id: number) => {
    setSelectedWorkerId(id);
    if(hasPermission) {
      setShowRightPanel("edit");
    } else {
      setShowRightPanel("detail");
    }
  };

  const closeRightPanel = () => {
    setShowRightPanel("");
    setSelectedWorkerId(null);
  };

  useEffect(() => {
    if (user && logisticsTypes.includes(user.userType)) {
      setHasPermission(true);
    }
  }, [user]);

  return (
    <Panel>
      <HeaderPanel name={"Trabajadores"}>
        <Permission user={user} allow={logisticsTypes}>
          <AddButton onClick={() => setShowRightPanel("new")} />
          </Permission>
      </HeaderPanel>
        <WorkerTable reFetch={reFetch} onSee={handleSeeDetail} isAdmin={hasPermission} />
        
        {showRightPanel === "new" && (
          <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
            <NewWorker successAction={successAction} closeAction={closeRightPanel} />
          </div>  
        )}
        {showRightPanel === "edit" && selectedWorkerId && (
          <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
            <EditWorker workerId={selectedWorkerId} successAction={successAction} closeAction={closeRightPanel} />
          </div>
        )}
        {showRightPanel === "detail" && selectedWorkerId && (
          <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center">
            <Worker workerId={selectedWorkerId} closeAction={closeRightPanel} />
          </div>
        )}
    </Panel>
  );
}