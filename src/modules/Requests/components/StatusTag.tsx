interface StatusTagProps {
  status: string;
}

const statusColor = {
  "Borrador": "#9ca3af", // gray-400
  "En progreso": "#d97706", // amber-600
  "Revisada": "#fbbf24", // yellow-600
  "Aprobada": "#4ade80", // green-500
  "Rechazada": "#ef4444", // red-500
  "Atendida": "#06b6d4", // cyan-500
  "Completada": "#3b82f6", // purple-500
};

export default function StatusTag( { status }: StatusTagProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-white font-semibold text-sm`} 
          style={{ backgroundColor: statusColor[status as keyof typeof statusColor] || '#9ca3af' }}>
            {status.toUpperCase()}
    </span>
  );
}