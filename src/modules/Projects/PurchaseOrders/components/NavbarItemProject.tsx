import { useNavigate, useParams, useLocation } from "react-router-dom";

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
      className={`text-gray-500 p-2 rounded-tr-xl rounded-tl-xl border-b-2 cursor-pointer z-10 ${
        isActive ? "text-primary font-semibold bg-primary-50 border-primary" : "border-transparent hover:bg-gray-50 hover:border-gray-200"
      }`}
    >
      {name}
    </div>
  );
}