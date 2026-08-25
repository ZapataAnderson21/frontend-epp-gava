import { motion } from "framer-motion";
import {
  CalendarCheck as TbCalendarCheck,
  CalendarClock as TbCalendarTime,
  CalendarX as TbCalendarOff,
  LoaderCircle as CgSpinner,
  TriangleAlert as TbAlertTriangle,
} from "lucide-react";


interface ProjectTimelineProps {
  loading?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

// Parsear fecha UTC interpretándola como fecha en Lima (sin desfase de día)
function parseUtcDateAsLocal(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // Extraer solo la parte de fecha YYYY-MM-DD
  const ymd = dateStr.split("T")[0];
  // Crear fecha como medianoche local (evita el desfase UTC)
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function ProjectTimeline({
  loading = false,
  startDate,
  endDate,
}: ProjectTimelineProps) {
  const today = new Date();
  // Usar solo la fecha (sin hora) para comparaciones correctas
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const start = parseUtcDateAsLocal(startDate);
  const end = parseUtcDateAsLocal(endDate);

  // Calcular métricas de tiempo
  const calculateTimeMetrics = () => {
    if (!start || !end) {
      return {
        progress: 0,
        daysElapsed: 0,
        daysRemaining: 0,
        totalDays: 0,
        isOverdue: false,
        isNotStarted: true,
        status: "sin-fechas" as const,
      };
    }

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((todayMidnight.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((end.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

    // Determinar estado
    let status: "sin-fechas" | "no-iniciado" | "en-curso" | "por-vencer" | "vencido" = "en-curso";
    
    if (todayMidnight < start) {
      status = "no-iniciado";
    } else if (daysRemaining < 0) {
      status = "vencido";
    } else if (daysRemaining <= 7) {
      status = "por-vencer";
    }

    const progress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

    return {
      progress,
      daysElapsed: Math.max(0, daysElapsed),
      daysRemaining: Math.max(0, daysRemaining),
      totalDays,
      isOverdue: daysRemaining < 0,
      isNotStarted: today < start,
      status,
    };
  };

  const metrics = calculateTimeMetrics();

  // Configuración del círculo
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (metrics.progress / 100) * circumference;

  // Color según el estado
  const getStatusColor = () => {
    switch (metrics.status) {
      case "en-curso":
        return "#3b82f6"; // blue
      case "por-vencer":
        return "#f59e0b"; // amber
      case "vencido":
        return "#ef4444"; // red
      case "no-iniciado":
        return "#6b7280"; // gray
      default:
        return "#d1d5db"; // gray-300
    }
  };

  const strokeColor = getStatusColor();

  // Formatear fecha
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Info items
  const timelineItems = [
    { 
      label: "Inicio", 
      value: formatDate(start), 
      icon: TbCalendarCheck, 
      color: "#22c55e" 
    },
    { 
      label: "Fin", 
      value: formatDate(end), 
      icon: TbCalendarOff, 
      color: "#ef4444" 
    },
    { 
      label: "Días transcurridos", 
      value: start ? `${metrics.daysElapsed}` : "—", 
      icon: TbCalendarTime, 
      color: "#3b82f6" 
    },
    { 
      label: "Días restantes", 
      value: end ? `${metrics.daysRemaining}` : "—", 
      icon: TbCalendarTime, 
      color: metrics.daysRemaining <= 7 && metrics.daysRemaining > 0 ? "#f59e0b" : "#6b7280" 
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <CgSpinner className="animate-spin text-3xl text-gray-400" />
        <span className="text-xs text-gray-500 mt-2">Cargando...</span>
      </div>
    );
  }

  // Si no hay fechas configuradas
  if (!start && !end) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <TbCalendarTime className="text-4xl mb-2" />
        <span className="text-xs">Sin fechas configuradas</span>
        <span className="text-2xs mt-1">Edita el proyecto para agregar fechas</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col mt-3">
      {/* Sección superior: Radial + Info rápida */}
      <div className="flex items-center justify-center gap-6">
        {/* Radial Chart */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Fondo del círculo */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            {/* Progreso */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: progressOffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>

          {/* Contenido central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="text-2xl font-extrabold text-gray-800"
            >
              {metrics.progress}%
            </motion.span>
            <span className="text-2xs text-gray-500">Tiempo</span>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="flex flex-col gap-2">
          <div className="text-center">
            <span className="text-2xl font-extrabold text-gray-800">{metrics.daysRemaining}</span>
            <span className="text-xs text-gray-500 ml-1">días</span>
          </div>
          <span className="text-xs text-gray-500">restantes</span>
          
          {/* Alerta si está por vencer o vencido */}
          {metrics.status === "por-vencer" && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md mt-1"
            >
              <TbAlertTriangle className="text-base" />
              <span className="text-2xs font-medium">Por vencer</span>
            </motion.div>
          )}
          
          {metrics.status === "vencido" && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md mt-1"
            >
              <TbAlertTriangle className="text-base" />
              <span className="text-2xs font-medium">Proyecto vencido</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-100 my-4" />

      {/* Info de fechas */}
      <div className="grid grid-cols-2 gap-2">
        {timelineItems.map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <item.icon className="text-base" style={{ color: item.color }} />
            <div className="flex flex-col">
              <span className="text-2xs text-gray-500">{item.label}</span>
              <span className="text-xs font-bold text-gray-800">{item.value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Barra de progreso temporal */}
      <div className="mt-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.progress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full"
            style={{ backgroundColor: strokeColor }}
          />
        </div>
      </div>

      {/* Total de días */}
      <div className="flex justify-between items-center mt-3 text-2xs text-gray-500">
        <span>Duración: {metrics.totalDays} días</span>
        <span>{metrics.daysElapsed} días transcurridos</span>
      </div>
    </div>
  );
}
