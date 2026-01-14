import { useNavigate } from "react-router-dom";
import { SeeButton } from "../../../../../../../common/button";
import { ProjectProgress } from "../components";

interface ProjectProgressCardProps {
  projectId: string | undefined;
}

export default function ProjectProgressCard({ projectId }: ProjectProgressCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full bg-white border border-gray-50 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h3 className="text-xl font-extrabold text-gray-800">Avance del Proyecto</h3>
        <SeeButton onClick={() => navigate(`/admin/projects/${projectId}/progress`)} />
      </div>
      <ProjectProgress projectId={projectId} />
    </div>
  );
}
