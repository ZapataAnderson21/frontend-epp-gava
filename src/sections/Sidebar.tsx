import { FaFileLines, FaHelmetSafety, FaUsers, FaCubes } from "react-icons/fa6";
import { FaHome, FaProjectDiagram, FaTools } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import SidebarItem from "./SidebarItem";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiAlertFill } from "react-icons/ri";
import { useApiAction } from "../hooks/useApiAction";
import { userApi } from "../data/apiUrl";

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  setIsOpen?: (value: boolean) => void;
}

export default function Sidebar({ isOpen, isMobile, setIsOpen }: SidebarProps) {
  const [isElementosOpen, setIsElementosOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    console.error("No access token found in localStorage");
    return null;
  }

  // instancia del hook para logout
  const { execute: logoutAction, loading: loggingOut } = useApiAction<null>();

  const handleLogout = async () => {
    try {
      const response = await logoutAction(`${userApi}logout`, "POST", {
        accessToken,
      });

      if (response.statusCode === 200) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/");
      } else {
        console.error("Error logging out:", response.message);
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsOpen?.(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMobile, setIsOpen]);

  return (
    <section
      ref={sidebarRef}
      className={`text-gray-500
        ${isMobile
          ? `absolute top-0 left-0 h-screen w-[220px] bg-white transform ${
              isOpen ? "translate-x-0" : "-translate-x-[220px]"
            } transition-transform duration-300 ease-in-out shadow-2xl z-10`
          : `fixed top-0 left-0 h-screen w-[220px] shadow-gray-300 shadow-md bg-white z-10`
        }
      `}
    >
      <div className="flex flex-col justify-between h-full overflow-y-auto">
        <div className="flex flex-col gap-2 py-3 px-4">
          <div className="flex flex-row items-center justify-start m-3">
            <img src="/logo-gava.png" alt="Logo" className="h-14" />
          </div>
          <SidebarItem icon={<FaHome />} label="Inicio" href="/admin/" />
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
                <SidebarItem icon={<FaHelmetSafety />} label="EPP" href="/admin/elements/type/security" />
                <SidebarItem icon={<FaTools />} label="Operativos" href="/admin/elements/type/operative" />
              </div>
            )}
          </div>

          <SidebarItem icon={<FaUsers />} label="Usuarios" href="/admin/users" />
          <SidebarItem icon={<RiAlertFill />} label="Emergencias" href="/admin/emergencies" />
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-300 py-4 px-6">
          <SidebarItem
            icon={<IoLogOut />}
            label={loggingOut ? "Saliendo..." : "Salir"}
            onClick={handleLogout}
          />
        </div>
      </div>
    </section>
  );
}
