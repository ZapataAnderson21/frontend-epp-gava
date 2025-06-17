import { FaFileLines, FaHelmetSafety, FaUsers } from "react-icons/fa6";
import { FaHistory } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import SidebarItem from "./SidebarItem";

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
}

export default function Sidebar({ isOpen, isMobile }: SidebarProps) {
  return (
    <section className={`text-[14px] text-gray-500
      ${isMobile ? `absolute h-full w-[200px] bg-white left-[-200px] ${isOpen && "translate-x-[200px]"} transition-all duration-300 ease-in-out shadow-2xl z-10`
        : `sticky flex h-full col-span-1 row-span-1 shadow-gray-300 shadow-md`
      }
      `}>
      <div className="flex flex-col gap-2 items-start justify-between w-full h-full">
        <div className="w-full">
          <div className="flex flex-col items-start justify-start w-full py-4 px-6">
            <SidebarItem icon={<FaFileLines />} label="Solicitudes" href="/admin/requests" />
            <SidebarItem icon={<FaHelmetSafety />} label="EPP" href="/admin/epps" />
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
