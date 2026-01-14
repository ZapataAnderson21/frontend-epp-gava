import { MdOutlineContentCopy } from "react-icons/md";
import { TbCalendar, TbLocation } from "react-icons/tb";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";
import type { Project } from "../../../../../../../data/types";

interface ProjectInfoCardProps {
  project: Project | null;
  loading: boolean;
  startDate: string;
  endDate: string;
}

export default function ProjectInfoCard({ project, loading, startDate, endDate }: ProjectInfoCardProps) {
  const copyCode = () => {
    if (project?.code) {
      navigator.clipboard.writeText(project.code);
      toast('Código copiado al portapapeles', {
        icon: <MdOutlineContentCopy />,
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 bg-white border border-gray-50 rounded-xl px-5 py-7 shadow-sm h-full">
      <h3 className="text-xl font-extrabold text-gray-800">Información del Proyecto</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2 w-full">
        
        <div className="col-span-1">
          <h4 className="font-bold">Código</h4>
          <div className="flex flex-row gap-2 items-center cursor-pointer w-fit" onClick={copyCode}>
            <MdOutlineContentCopy className="text-gray-700" />
            <span className="text-sm text-gray-500">
              {loading ? <CgSpinner className="animate-spin" /> : project?.code || "N/A"}
            </span>
          </div>
        </div>

        <div className="col-span-1">
          <h4 className="font-bold">Ubicación</h4>
          <div className="flex flex-row gap-2 justify-start items-center">
            <TbLocation className="text-gray-700" />
            <span className="text-sm text-gray-500">
              {loading ? <CgSpinner className="animate-spin" /> : project?.location || "—"}
            </span>
          </div>
        </div>

        
        <div className="col-span-2">
          <h4 className="font-bold">Duración</h4>
          <div className="flex flex-row gap-2 items-center">
            <div className="p-1">
              <TbCalendar className="text-gray-700" />
            </div>
            <span className="text-sm text-gray-500">
              {loading ? <CgSpinner className="animate-spin" /> : startDate ? 
              startDate.split("-").reverse().join("/").concat(` - ${endDate.split("-").reverse().join("/")}`): "—"}
            </span>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <h4 className="font-bold">Descripción</h4>
          <div className="flex flex-row gap-2 items-center">
            <span className="text-sm text-gray-500">
                {loading ? <CgSpinner className="animate-spin" /> : project?.description ? project.description : "N/A"}
              </span>
          </div>
        </div>
      </div>
    </div>
  );
}
