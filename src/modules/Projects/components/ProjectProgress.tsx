import { motion } from "framer-motion";
import { CgSpinner } from "react-icons/cg";
import { TbCircleFilled, TbAlertCircle, TbClock, TbChecks } from "react-icons/tb";
import { useFetch } from "../../../hooks";
import { taskApi } from "../../../data/apiUrl";

interface TaskProgressResponse {
  projectId: number;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  overdue: number;
  progressPercentage: number;
}

interface ProjectProgressProps {
  loading?: boolean;
  /** ID del proyecto para cargar las estadísticas */
  projectId?: number | string;
}

// Colores para cada estado
const STATUS_COLORS = {
  completed: "#22c55e",   // green-500
  inProgress: "#3b82f6",  // blue-500
  pending: "#f59e0b",     // amber-500
  cancelled: "#6b7280",   // gray-500
  overdue: "#ef4444",     // red-500
};

export default function ProjectProgress({
  loading: externalLoading = false,
  projectId,
}: ProjectProgressProps) {
  // Fetch de estadísticas desde el API
  const { data: taskStats, loading: statsLoading } = useFetch<TaskProgressResponse>(
    projectId ? `${taskApi}project/${projectId}/progress` : "",
    [projectId]
  );

  const loading = externalLoading || statsLoading;

  // Valores por defecto si no hay datos
  const stats = taskStats || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    cancelled: 0,
    overdue: 0,
    progressPercentage: 0,
  };

  // Excluir canceladas del cálculo de progreso
  const activeTasks = stats.total - stats.cancelled;
  const progress = stats.progressPercentage ?? (activeTasks > 0 
    ? Math.round((stats.completed / activeTasks) * 100) 
    : 0);

  // Configuración del círculo
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  // Color del progreso según el porcentaje
  const getProgressColor = () => {
    if (progress >= 75) return STATUS_COLORS.completed;
    if (progress >= 50) return STATUS_COLORS.inProgress;
    if (progress >= 25) return STATUS_COLORS.pending;
    return STATUS_COLORS.overdue;
  };

  const strokeColor = getProgressColor();

  // Leyenda de estados
  const legendItems = [
    { label: "Completadas", count: stats.completed, color: STATUS_COLORS.completed, icon: TbChecks },
    { label: "En progreso", count: stats.inProgress, color: STATUS_COLORS.inProgress, icon: TbClock },
    { label: "Pendientes", count: stats.pending, color: STATUS_COLORS.pending, icon: TbCircleFilled },
    { label: "Canceladas", count: stats.cancelled, color: STATUS_COLORS.cancelled, icon: TbCircleFilled },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <CgSpinner className="animate-spin text-4xl text-gray-400" />
        <span className="text-sm text-gray-500 mt-2">Cargando...</span>
      </div>
    );
  }

  // Si no hay tareas
  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <TbChecks className="text-5xl mb-2" />
        <span className="text-sm">Sin tareas registradas</span>
        <span className="text-xs mt-1">Agrega tareas desde el diagrama de Gantt</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
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
              className="text-3xl font-extrabold text-gray-800"
            >
              {progress}%
            </motion.span>
            <span className="text-xs text-gray-500">Completado</span>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="flex flex-col gap-2">
          <div className="text-center">
            <span className="text-3xl font-extrabold text-gray-800">{stats.completed}</span>
            <span className="text-lg text-gray-500">/{activeTasks}</span>
          </div>
          <span className="text-sm text-gray-500">tareas completadas</span>
          
          {/* Alerta de tareas vencidas */}
          {stats.overdue > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md mt-1"
            >
              <TbAlertCircle className="text-lg" />
              <span className="text-xs font-medium">{stats.overdue} vencida{stats.overdue > 1 ? 's' : ''}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-100 my-4" />

      {/* Leyenda de estados */}
      <div className="grid grid-cols-2 gap-2">
        {legendItems.map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <item.icon className="text-lg" style={{ color: item.color }} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">{item.label}</span>
              <span className="text-sm font-bold text-gray-800">{item.count}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Barra de progreso detallada */}
      <div className="mt-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
          {stats.completed > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full"
              style={{ backgroundColor: STATUS_COLORS.completed }}
              title={`Completadas: ${stats.completed}`}
            />
          )}
          {stats.inProgress > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
              transition={{ duration: 1, delay: 0.7 }}
              className="h-full"
              style={{ backgroundColor: STATUS_COLORS.inProgress }}
              title={`En progreso: ${stats.inProgress}`}
            />
          )}
          {stats.pending > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.pending / stats.total) * 100}%` }}
              transition={{ duration: 1, delay: 0.9 }}
              className="h-full"
              style={{ backgroundColor: STATUS_COLORS.pending }}
              title={`Pendientes: ${stats.pending}`}
            />
          )}
          {stats.cancelled > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.cancelled / stats.total) * 100}%` }}
              transition={{ duration: 1, delay: 1.1 }}
              className="h-full"
              style={{ backgroundColor: STATUS_COLORS.cancelled }}
              title={`Canceladas: ${stats.cancelled}`}
            />
          )}
        </div>
      </div>

      {/* Total de tareas */}
      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
        <span>Total: {stats.total} tareas</span>
        {stats.cancelled > 0 && (
          <span className="text-gray-400">{stats.cancelled} cancelada{stats.cancelled > 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}
