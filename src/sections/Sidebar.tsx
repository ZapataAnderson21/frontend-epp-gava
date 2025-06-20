import { FaFileLines, FaHelmetSafety, FaUsers, FaCubes } from "react-icons/fa6";
import { FaProjectDiagram, FaTools } from "react-icons/fa";
import { FaHistory } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import SidebarItem from "./SidebarItem";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
}

export default function Sidebar({ isOpen, isMobile }: SidebarProps) {

  const [isElementosOpen, setIsElementosOpen] = useState(false);
  
  return (
    <section className={`text-[14px] text-gray-500
      ${isMobile ? `absolute h-full w-[220px] bg-white left-[-220px] ${isOpen && "translate-x-[220px]"} transition-all duration-300 ease-in-out shadow-2xl z-10`
        : `sticky flex h-full col-span-1 row-span-1 shadow-gray-300 shadow-md`
      }
      `}>
      <div className="flex flex-col gap-2 items-start justify-between w-full h-full">
        <div className="w-full">
          <div className="flex flex-col items-start justify-start w-full py-4 px-6">
            <SidebarItem icon={<FaProjectDiagram />} label="Proyectos" href="/admin/projects" />
            <SidebarItem icon={<FaFileLines />} label="Requerimientos" href="/admin/requests" />
            <div className="w-full flex flex-col">
              <div
                className="flex flex-row items-center justify-between w-full cursor-pointer"
                onClick={() => setIsElementosOpen(!isElementosOpen)}
              >
                <SidebarItem icon={<FaCubes />} label="Elementos" isRoot={true} isOpen={isElementosOpen} />
              </div>

              {isElementosOpen && (
                <div className="w-full flex flex-col pl-2">
                  <SidebarItem icon={<FaHelmetSafety />} label="Seguridad" href="/admin/elements" />
                  <SidebarItem icon={<FaTools />} label="Operativos" href="/admin/elements" />
                </div>
              )}
            </div>
            <SidebarItem icon={<FaUsers />} label="Usuarios" href="/admin/users" />
            <SidebarItem icon={<FaHistory />} label="Historial" href="#" />
          </div>
        </div>
        <div className="flex flex-col gap-4 items-start justify-center w-full border-t border-gray-300 py-4 px-6">
          <SidebarItem icon={<IoLogOut />} label="Salir" href="/" />
        </div>
      </div>
    </section>
  );
}









