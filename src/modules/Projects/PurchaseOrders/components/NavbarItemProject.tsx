import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

interface NavbarItemProjectProps {
  to: string;
  name: string;
}

export default function NavbarItemProject ({ to, name } : NavbarItemProjectProps ) {
  
  const { id: projectId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const basePath = `/admin/projects/${projectId}`;
  const fullPath = to ? `${basePath}/${to}` : basePath;
  
  // Para "Resumen" (to=''), solo activo si la ruta es exactamente el basePath
  // Para otros, activo si la ruta incluye el segmento
  const isActive = to 
    ? location.pathname.includes(`/${to}`) 
    : location.pathname === basePath || location.pathname === `${basePath}/`;

  return (
    <div 
      onClick={() => navigate(fullPath)} 
      className={`relative text-gray-500 p-2 rounded-tr-xl rounded-tl-xl cursor-pointer z-10 ${
        isActive ? "text-primary font-semibold" : "hover:text-gray-700"
      }`}
    >
      {/* Fondo animado */}
      {isActive && (
        <motion.div
          layoutId="navbar-active-bg"
          className="absolute inset-0 bg-primary-50 rounded-tr-xl rounded-tl-xl border-b-2 border-primary -z-10"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
      )}
      
      {/* Borde inferior para items inactivos */}
      {!isActive && (
        <div className="absolute inset-0 border-b-2 border-transparent hover:border-gray-200 rounded-tr-xl rounded-tl-xl -z-10 transition-colors" />
      )}
      
      {name}
    </div>
  );
}