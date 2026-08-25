import {
  Banknote as FaMoneyBillWave,
  Boxes as FaCubes,
  CalendarCheck as FaCalendarCheck,
  ChartColumn as FaChartColumn,
  ClipboardCheck as FaClipboardCheck,
  FileChartColumn as FaFileInvoiceDollar,
  FileText as FaFileLines,
  LogOut as IoLogOut,
  Network as FaProjectDiagram,
  PackageOpen as FaBoxOpen,
  Settings as IoMdSettings,
  TriangleAlert as RiAlertFill,
  Truck as FaTruck,
  UserRoundCog as FaUserTie,
  Users as FaUsers,
  UsersRound as FaUserGroup,
} from "lucide-react";


import SidebarItem from "./SidebarItem";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useApiAction } from "../hooks/useApiAction";
import { userApi } from "../data/apiUrl";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrentUser } from "../hooks";
import { adminTypes, documentExpirationTypes, logisticsTypes, monthlyEvaluationTypes } from "../utils";
import Permission from "../common/auth/Permission";
import { NotificationBell } from "../components";

import UserSettingsModal from "./UserSettingsModal";

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  setIsOpen?: (value: boolean) => void;
}

export default function Sidebar({ isOpen, isMobile, setIsOpen }: SidebarProps) {
  const { user, refetch } = useCurrentUser();
  const [currentUser, setCurrentUser] = useState(user);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const accessToken = localStorage.getItem("accessToken");

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

  const baseDelay = 0.1;
  const perItemDelay = 0.075;

  if (!accessToken) return null;

  return (
    <section
      ref={sidebarRef}
      className={`text-gray-500
        ${isMobile
          ? `fixed top-0 left-0 h-screen w-[260px] bg-white transform ${isOpen ? "translate-x-0" : "-translate-x-[280px]"} transition-transform duration-300 ease-in-out shadow-2xl z-10`
          : `fixed top-0 left-0 h-screen w-[260px] shadow-gray-300 shadow-md bg-white z-10`
        }`}
    >
      <div className="sidebar-scrollbar flex flex-col justify-between h-full overflow-y-auto">
        <div className="flex flex-col gap-2 py-3 px-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: baseDelay }}
            className="flex flex-row items-center justify-start mt-6 mb-4"
          >
            <img src="/logo-gava.png" alt="Logo" className="h-14 ml-2" />
          </motion.div>

          <SidebarItem icon={<FaChartColumn className="w-5 h-5" />} label="Dashboard" href="/admin/dashboard" exactActivePaths={["/admin"]} index={1} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <SidebarItem icon={<FaProjectDiagram className="w-5 h-5" />} label="Proyectos" href="/admin/projects" index={2} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <Permission user={user} allow={logisticsTypes}>
            <SidebarItem icon={<FaTruck className="w-5 h-5" />} label="Proveedores" href="/admin/suppliers" index={3} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>
          <SidebarItem icon={<FaFileLines className="w-5 h-5" />} label="Requerimientos" href="/admin/requests" index={4} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <SidebarItem icon={<FaFileInvoiceDollar className="w-5 h-5" />} label="Cotizaciones" href="/admin/quotations" index={5} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <SidebarItem icon={<FaUserGroup className="w-5 h-5" />} label="Clientes" href="/admin/clients" index={6} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <SidebarItem icon={<FaCubes className="w-5 h-5" />} label="Inventario" href="/admin/inventory" activePaths={["/admin/elements"]} index={7} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />

          <Permission user={user} allow={logisticsTypes}>
            <SidebarItem icon={<FaBoxOpen className="w-5 h-5" />} label="Recursos Ord. Compra" href="/admin/resources" index={7} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>

          <SidebarItem icon={<FaUserTie className="w-5 h-5" />} label="Usuarios" href="/admin/users" index={8} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <SidebarItem icon={<RiAlertFill className="w-5 h-5" />} label="Emergencias" href="/admin/emergencies" index={9} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          <SidebarItem icon={<FaUsers className="w-5 h-5" />} label="Trabajadores" href="/admin/workers" index={10} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />

          <Permission user={user} allow={monthlyEvaluationTypes}>
            <SidebarItem icon={<FaClipboardCheck className="w-5 h-5" />} label="Eval. mensuales" href="/admin/worker-monthly-evaluations" index={11} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>

          <Permission user={user} allow={documentExpirationTypes}>
            <SidebarItem icon={<FaCalendarCheck className="w-5 h-5" />} label="Vencimientos" href="/admin/document-expirations" index={12} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>

          <Permission user={user} allow={adminTypes}>
            <SidebarItem icon={<FaMoneyBillWave className="w-5 h-5" />} label="Planillas" href="/admin/payrolls" index={13} baseDelay={baseDelay} perItemDelay={perItemDelay} onClick={() => isMobile && setIsOpen?.(false)} />
          </Permission>
        </div>

        <div className="flex flex-col border-t border-gray-300 py-4 px-4">
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
              <span className="text-gray-700 font-semibold text-xs truncate">
                {currentUser?.name} {currentUser?.lastName}
              </span>
              <span className="text-[#0047a3] text-2xs font-bold uppercase">
                {currentUser?.userType}
              </span>
            </div>
            <NotificationBell />
          </motion.div>

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
                  icon={<IoMdSettings className="w-5 h-5" />}
                  label="Configuracion"
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
                  icon={<IoLogOut className="w-5 h-5" />}
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
