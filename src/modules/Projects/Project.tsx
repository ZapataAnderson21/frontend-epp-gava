import { Outlet, useParams } from "react-router-dom";
import { useFetch } from "../../hooks";
import type { Project } from "../../data/types";
import { projectApi } from "../../data/apiUrl";
import { HeaderActions } from "./sections";
import { HeaderPanel, Panel } from "../../common/panel";
import { ErrorMessage } from "../../common/error";
import { NavbarProject } from "./PurchaseOrders/components";

export default function Project() {
  const { id: projectId } = useParams<{ id: string }>();

  const { data: project, loading, error } = useFetch<Project>( `${projectApi}${projectId}`, [projectId]);

  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <Panel>

      <div className="w-full flex justify-end">
        {projectId && <HeaderActions projectId={Number(projectId)} />}
      </div>

      <HeaderPanel loading={loading} name={`${project ? project?.name : ""}`} />

      <NavbarProject />

      <Outlet />
      
    </Panel>
  );
}
