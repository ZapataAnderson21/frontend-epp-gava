interface StatusTagProps {
  status: string;
}

export const statusColor = {
  "Activo": "#228b22",
  "Inactivo": "#c53030"
}

export default function StatusTag( { status }: StatusTagProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-white font-semibold text-sm`} 
          style={{ backgroundColor: statusColor[status as keyof typeof statusColor] || '#9ca3af' }}>
            {status.toUpperCase()}
    </span>
  );
}