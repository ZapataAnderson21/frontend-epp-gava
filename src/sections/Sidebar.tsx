import { FaFileLines, FaHelmetSafety, FaUsers, FaCubes, FaTruck, FaBoxOpen, FaUserTie, FaMoneyBillWave, FaFileInvoiceDollar, FaUserGroup, FaClipboardCheck } from "react-icons/fa6";
import { FaProjectDiagram, FaTools } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import SidebarItem from "./SidebarItem";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiAlertFill } from "react-icons/ri";
import { useApiAction } from "../hooks/useApiAction";
import { userApi } from "../data/apiUrl";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrentUser } from "../hooks";
import { adminTypes, logisticsTypes, monthlyEvaluationTypes } from "../utils";
import Permission from "../common/auth/Permission";
import { NotificationBell } from "../components";
import { IoMdSettings } from "react-icons/io";
import UserSettingsModal from "./UserSettingsModal";

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  setIsOpen?: (value: boolean) => void;
}

export default function Sidebar({ isOpen, isMobile, setIsOpen }: SidebarProps) {
  const { user, refetch } = useCurrentUser();
  const [currentUser, setCurrentUser] = useState(user);
  const [isElementosOpen, setIsElementosOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
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

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // base para delays
  const baseDelay = 0.1;     // s
  const perItemDelay = 0.075;  // s

  return (
    <section
      ref={sidebarRef}
      className={`text-gray-500
        ${isMobile
          ? `fixed top-0 left-0 h-screen w-[280px] bg-white transform ${isOpen ? "translate-x-0" : "-translate-x-[280px]"} transition-transform duration-300 ease-in-out shadow-2xl z-10`
          : `fixed top-0 left-0 h-screen w-[280px] shadow-gray-300 shadow-md bg-white z-10`
        }`}
    >
      <div className="flex flex-col justify-between h-full overflow-y-auto">
        <div className="flex flex-col gap-2 py-3 px-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: baseDelay }}
            className="flex flex-row items-center justify-start mt-7"
          >
            <img src="/logo-gava.png" alt="Logo" className="h-14 ml-2" />
          </motion.div>

          <SidebarItem icon={<FaProjectDiagram />} label="Proyectos" href="/admin/projects" index={1} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <Permission user={user} allow={logisticsTypes}>
            <SidebarItem icon={<FaTruck />} label="Proveedores"    href="/admin/suppliers" index={2} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>
          <SidebarItem icon={<FaFileLines />} label="Requerimientos" href="/admin/requests" index={3} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <SidebarItem icon={<FaFileInvoiceDollar />} label="Cotizaciones" href="/admin/quotations" index={4} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <SidebarItem icon={<FaUserGroup />} label="Clientes" href="/admin/clients" index={5} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />

          {/* Grupo con desplegable */}
          <div className="w-full flex flex-col">
            <SidebarItem
              icon={<FaCubes />}
              label="Elementos SSOMA"
              isRoot
              isOpen={isElementosOpen}
              onClick={() => setIsElementosOpen((v) => !v)}
              index={6}
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
                      onClick={() => isMobile && setIsOpen?.(false)}
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
                      onClick={() => isMobile && setIsOpen?.(false)}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Permission user={user} allow={logisticsTypes}>
            <SidebarItem icon={<FaBoxOpen />} label="Recursos Ord. Compra" href="/admin/resources" index={7} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>
          
          <SidebarItem icon={<FaUserTie />} label="Usuarios" href="/admin/users" index={8} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />

          <SidebarItem icon={<RiAlertFill />} label="Emergencias" href="/admin/emergencies" index={9} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          
          <SidebarItem icon={<FaUsers />} label="Trabajadores" href="/admin/workers" index={10} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />

          <Permission user={user} allow={monthlyEvaluationTypes}>
            <SidebarItem icon={<FaClipboardCheck />} label="Eval. mensuales" href="/admin/worker-monthly-evaluations" index={11} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>

          <Permission user={user} allow={adminTypes}>
            <SidebarItem icon={<FaMoneyBillWave />} label="Planillas" href="/admin/payrolls" index={12} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>
          
        </div>

        {/* Sección inferior: Usuario y Logout */}
        <div className="flex flex-col border-t border-gray-300 py-4 px-4">
          {/* Info del usuario - clickeable */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: baseDelay + 10 * perItemDelay }}
            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setIsUserMenuOpen((v) => !v)}
          >
            <div className="flex items-center justify-center border-2 border-[#0047a3] rounded-full size-10 overflow-hidden flex-shrink-0">
              <img src="/buho-gava.webp" alt="Avatar" className="size-10 object-cover" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-gray-700 font-semibold text-sm truncate">
                {currentUser?.name} {currentUser?.lastName}
              </span>
              <span className="text-[#0047a3] text-xs font-bold uppercase">
                {currentUser?.userType}
              </span>
            </div>
            <NotificationBell />
          </motion.div>

          {/* Botón de logout - aparece al hacer clic en usuario */}
          <AnimatePresence initial={false}>
            {isUserMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2"
              >
                <SidebarItem
                  icon={<IoMdSettings />}
                  label="Configuración"
                  onClick={() => {
                    setIsUserSettingsOpen(true);
                    setIsUserMenuOpen(false);
                    if (isMobile) setIsOpen?.(false);
                  }}
                  index={0}
                  baseDelay={0}
                  perItemDelay={0}
                />
                <SidebarItem
                  icon={<IoLogOut />}
                  label={loggingOut ? "Saliendo..." : "Salir"}
                  onClick={handleLogout}
                  index={0}
                  baseDelay={0}
                  perItemDelay={0}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <UserSettingsModal
        open={isUserSettingsOpen}
        user={currentUser ?? null}
        onClose={() => setIsUserSettingsOpen(false)}
        onUpdated={(updated) => {
          setCurrentUser(updated);
          refetch();
        }}
      />
    </section>
  );
}
