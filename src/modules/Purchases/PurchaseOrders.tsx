import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { HeaderPanel, Panel } from "../../common/panel";
import { Button, Select } from "../../components";
import { projectApi, supplierApi } from "../../data/apiUrl";
import type { Project, Supplier } from "../../data/types";
import { useFetch } from "../../hooks";
import { useAccess } from "../../permissions/AccessProvider";
import PurchaseOrderTable from "./PurchaseOrderTable";

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { can } = useAccess();
  const [newProjectId, setNewProjectId] = useState(0);
  const projects = useFetch<Project[]>(projectApi);
  const suppliers = useFetch<Supplier[]>(supplierApi);

  if (projects.loading || suppliers.loading) return <LoadingSkeletonTable />;
  if (projects.error) return <ErrorMessage errorMessage={projects.error} />;
  if (suppliers.error) return <ErrorMessage errorMessage={suppliers.error} />;

  const projectOptions = [
    { value: 0, label: "Selecciona un proyecto" },
    ...(projects.data ?? []).map((project) => ({
      value: project.projectId,
      label: project.name,
    })),
  ];

  return (
    <Panel>
      <HeaderPanel name="ÓRDENES DE COMPRA">
        {can("orders.manage") && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              name="new-purchase-order-project"
              value={newProjectId}
              onChange={(value) => setNewProjectId(Number(value))}
              options={projectOptions}
              ariaLabel="Proyecto para la nueva orden de compra"
            />
            <Button
              icon={<Plus />}
              label="Nueva orden de compra"
              bgColor="#0047a3"
              bgHoverColor="#003577"
              type="button"
              disabled={!newProjectId}
              onClick={() =>
                navigate(
                  `/admin/projects/${newProjectId}/purchase-orders/new`,
                )
              }
            />
          </div>
        )}
      </HeaderPanel>
      <PurchaseOrderTable
        projects={projects.data ?? []}
        suppliers={suppliers.data ?? []}
      />
    </Panel>
  );
}
