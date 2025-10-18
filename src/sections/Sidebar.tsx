import { FaFileLines, FaHelmetSafety, FaUsers, FaCubes, FaTruck, FaBoxOpen, FaUserTie } from "react-icons/fa6";
import { FaHome, FaProjectDiagram, FaTools } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import SidebarItem from "./SidebarItem";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiAlertFill } from "react-icons/ri";
import { useApiAction } from "../hooks/useApiAction";
import { userApi } from "../data/apiUrl";
import { AnimatePresence, motion } from "framer-motion";

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
  if (!accessToken) return null;

  const { execute: logoutAction, loading: loggingOut } = useApiAction<null>();
  const handleLogout = async () => {
    const response = await logoutAction(`${userApi}logout`, "POST", { accessToken });
    if (response.statusCode === 200) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isMobile, setIsOpen]);

  // base para delays
  const baseDelay = 0.1;     // s
  const perItemDelay = 0.075;  // s

  return (
    <section
      ref={sidebarRef}
      className={`text-gray-500
        ${isMobile
          ? `fixed top-0 left-0 h-screen w-[220px] bg-white transform ${isOpen ? "translate-x-0" : "-translate-x-[220px]"} transition-transform duration-300 ease-in-out shadow-2xl z-10`
          : `fixed top-0 left-0 h-screen w-[220px] shadow-gray-300 shadow-md bg-white z-10`
        }`}
    >
      <div className="flex flex-col justify-between h-full overflow-y-auto">
        <div className="flex flex-col gap-2 py-3 px-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: baseDelay }}
            className="flex flex-row items-center justify-start m-3"
          >
            <img src="/logo-gava.png" alt="Logo" className="h-14" />
          </motion.div>

          <SidebarItem icon={<FaHome />}           label="Inicio"         href="/admin/"                 index={0} baseDelay={baseDelay} perItemDelay={perItemDelay} />
          <SidebarItem icon={<FaProjectDiagram />} label="Proyectos"      href="/admin/projects"         index={1} baseDelay={baseDelay} perItemDelay={perItemDelay} />
          <SidebarItem icon={<FaTruck />}          label="Proveedores"    href="/admin/suppliers"        index={2} baseDelay={baseDelay} perItemDelay={perItemDelay} />
          <SidebarItem icon={<FaFileLines />}      label="Requerimientos" href="/admin/requests"         index={3} baseDelay={baseDelay} perItemDelay={perItemDelay} />

          {/* Grupo con desplegable */}
          <div className="w-full flex flex-col">
            <SidebarItem
              icon={<FaCubes />}
              label="Elementos"
              isRoot
              isOpen={isElementosOpen}
              onClick={() => setIsElementosOpen((v) => !v)}
              index={4}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
            />

            {/* Submenú animado abrir/cerrar */}
            <AnimatePresence initial={false}>
              {isElementosOpen && (
                <motion.div
                  className="w-full flex flex-col pl-2 overflow-hidden"
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: {
                      opacity: 1,
                      height: "auto",
                      transition: { when: "beforeChildren", staggerChildren: 0.06 }
                    },
                    collapsed: {
                      opacity: 0,
                      height: 0,
                      transition: { when: "afterChildren", duration: 0.2 }
                    }
                  }}
                >
                  {/* hijos con su propia animación */}
                  <motion.div
                    variants={{ hidden: { opacity: 0, x: -10 }, open: { opacity: 1, x: 0, transition: { duration: 0.2 } } }}
                  >
                    <SidebarItem
                      icon={<FaHelmetSafety />}
                      label="EPP"
                      href="/admin/elements/type/epp"
                      // si quieres más delay agrega index relativos
                      index={0}
                      baseDelay={0}
                      perItemDelay={0.05}
                    />
                  </motion.div>

                  <motion.div
                    variants={{ hidden: { opacity: 0, x: -10 }, open: { opacity: 1, x: 0, transition: { duration: 0.2 } } }}
                  >
                    <SidebarItem
                      icon={<FaTools />}
                      label="Operativos"
                      href="/admin/elements/type/operative"
                      index={1}
                      baseDelay={0}
                      perItemDelay={0.05}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <SidebarItem icon={<FaBoxOpen />} label="Recursos"   href="/admin/resources" index={5} baseDelay={baseDelay} perItemDelay={perItemDelay} />
          <SidebarItem icon={<FaUserTie />}   label="Usuarios"   href="/admin/users"     index={6} baseDelay={baseDelay} perItemDelay={perItemDelay} />
          <SidebarItem icon={<RiAlertFill />} label="Emergencias" href="/admin/emergencies" index={7} baseDelay={baseDelay} perItemDelay={perItemDelay} />
          <SidebarItem icon={<FaUsers />} label="Trabajadores" href="/admin/workers" index={8} baseDelay={baseDelay} perItemDelay={perItemDelay} />
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-300 py-4 px-6">
          <SidebarItem
            icon={<IoLogOut />}
            label={loggingOut ? "Saliendo..." : "Salir"}
            onClick={handleLogout}
            index={8}
            baseDelay={baseDelay}
            perItemDelay={perItemDelay}
          />
        </div>
      </div>
    </section>
  );
}
