import { ProjectTimeline } from "../components";
import { statusColor } from "../../../../Projects/components/ProjectTable";

interface ProjectTimelineCardProps {
  loading: boolean;
  status: string | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
}

export default function ProjectTimelineCard({ loading, status, startDate, endDate }: ProjectTimelineCardProps) {
  return (
    <div className="flex flex-col w-full bg-white border border-gray-50 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h3 className="text-lg font-extrabold text-gray-800">Tiempo del Proyecto</h3>
        <span 
          className="px-2 py-1 rounded-full text-white font-semibold text-xs"
          style={{ backgroundColor: statusColor[status as keyof typeof statusColor] || '#9ca3af' }}
        >
          {status?.toUpperCase()}
        </span>
      </div>
      <ProjectTimeline 
        loading={loading} 
        startDate={startDate} 
        endDate={endDate} 
      />
    </div>
  );
}
