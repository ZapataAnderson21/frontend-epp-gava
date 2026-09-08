import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AddButton from "../../common/button/AddButton";
import { HeaderPanel, Panel } from "../../common/panel";
import { DeleteConfirmDialog } from "../../components";
import { workerApi } from "../../data/apiUrl";
import type { Worker as WorkerData } from "../../data/types";
import { useApiAction } from "../../hooks";
import { useAccess } from "../../permissions/AccessProvider";
import EditWorker from "./Editworker";
import NewWorker from "./NewWorker";
import Worker from "./Worker";
import WorkerTable from "./WorkerTable";

export default function Workers() {
  const [reFetch, setReFetch] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<WorkerData | null>(null);
  const { execute: deleteWorker, loading: deleting } =
    useApiAction<WorkerData>();
  const { can } = useAccess();
  const hasPermission = can("workers.manage");

  const successAction = () => {
    setReFetch((prev) => prev + 1);
  };

  const handleSeeDetail = (id: number) => {
    setSelectedWorkerId(id);
    if (hasPermission) {
      setShowRightPanel("edit");
    } else {
      setShowRightPanel("detail");
    }
  };

  const closeRightPanel = () => {
    setShowRightPanel("");
    setSelectedWorkerId(null);
  };

  const handleDelete = async () => {
    if (!workerToDelete) return;

    await toast.promise(
      deleteWorker(`${workerApi}${workerToDelete.workerId}`, "DELETE"),
      {
        loading: "Eliminando trabajador...",
        success: (result) => {
          setWorkerToDelete(null);
          successAction();
          return result.message || "Trabajador eliminado exitosamente";
        },
        error: (error) =>
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el trabajador",
      },
    );
  };

  return (
    <Panel>
      <HeaderPanel name={"Trabajadores"}>
        {hasPermission && (
          <AddButton onClick={() => setShowRightPanel("new")} />
        )}
      </HeaderPanel>
      <WorkerTable
        reFetch={reFetch}
        onSee={handleSeeDetail}
        onDelete={setWorkerToDelete}
        isAdmin={hasPermission}
      />

      {showRightPanel && (
        <div
          style={{ boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
        >
          {showRightPanel === "new" && (
            <NewWorker
              successAction={successAction}
              closeAction={closeRightPanel}
            />
          )}
          {showRightPanel === "edit" && selectedWorkerId && (
            <EditWorker
              workerId={selectedWorkerId}
              successAction={successAction}
              closeAction={closeRightPanel}
            />
          )}
          {showRightPanel === "detail" && selectedWorkerId && (
            <Worker workerId={selectedWorkerId} closeAction={closeRightPanel} />
          )}
        </div>
      )}
      <DeleteConfirmDialog
        isOpen={Boolean(workerToDelete)}
        message={`¿Deseas eliminar a ${workerToDelete?.fullName ?? "este trabajador"}?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setWorkerToDelete(null)}
      />
      <Toaster position="top-center" />
    </Panel>
  );
}
