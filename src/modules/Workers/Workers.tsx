import { HeaderPanel, Panel } from "../../common/panel";
import WorkerTable from "./WorkerTable";
import { Button } from "../../components";
import { FaPlus } from "react-icons/fa6";
import NewWorker from "./NewWorker";
import { useState } from "react";
import Worker from "./Worker";

export default function Workers() {

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
        <Button
          icon={<FaPlus />}
          label="Agregar"
          onClick={() => setShowRightPanel("new")}
          bgColor="#0047a3"
          bgHoverColor="#003a80"
        />
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