import { useState } from "react";
import { HeaderPanel, Panel } from "../../common/panel";
import WorkerTable from "./WorkerTable";
import NewWorker from "./NewWorker";
import Worker from "./Worker";
import AddButton from "../../common/button/AddButton";
import { logisticsTypes } from "../../utils/userUtils";
import { useCurrentUser } from "../../hooks";
import Permission from "../../common/auth/Permission";

export default function Workers() {
  const { user } = useCurrentUser();

  const [reFetch, setReFetch] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  const successAction = () => { setReFetch(prev => prev + 1); }

  const handleSeeDetail = (id: number) => {
    setSelectedWorkerId(id);
    setShowRightPanel("detail");
  };

  const closeRightPanel = () => {
    setShowRightPanel("");
    setSelectedWorkerId(null);
  };

  return (
    <Panel>
      <HeaderPanel name={"Trabajadores"}>
        <Permission user={user} allow={logisticsTypes}>
          <AddButton onClick={() => setShowRightPanel("new")} />
          </Permission>
      </HeaderPanel>

      <section className="flex flex-row flex-wrap w-full gap-4">

        <div className="flex-1">
          <WorkerTable reFetch={reFetch} onSee={handleSeeDetail} />
        </div>
        {showRightPanel === "new" && (
          <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="w-full md:w-1/3 p-4 border-1 border-gray-200 rounded-lg">
            <NewWorker successAction={successAction} closeAction={closeRightPanel} />
          </div>  
        )}
        {showRightPanel === "detail" && selectedWorkerId && (
          <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="w-full md:w-1/3 p-4 border-1 border-gray-200 rounded-lg">
            <Worker workerId={selectedWorkerId} successAction={successAction} closeAction={closeRightPanel} />
          </div>
        )}
      </section>
    </Panel>
  );
}