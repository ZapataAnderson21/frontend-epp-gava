// src/components/cards/LoadingCard.tsx
import clsx from "clsx";

interface LoadingCardProps {
  className?: string;
  compact?: boolean; // para las cards pequeñas
}

export default function LoadingCard({ className, compact }: LoadingCardProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        "dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {/* shimmer */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />

      <div className="flex items-start justify-between">
        {/* Título */}
        <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />

        {/* Botón/Badge (ej. “Ver”) */}
        {!compact && (
          <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        )}
      </div>

      {/* Monto */}
      <div
        className={clsx(
          "mt-4 h-7 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700",
          compact && "h-6 w-40"
        )}
      />

      {/* Línea secundaria opcional (ej. moneda o etiqueta) */}
      <div
        className={clsx(
          "mt-2 h-4 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700",
          compact && "w-20"
        )}
      />

      {/* Ícono / tendencia a la derecha */}
      <div className="absolute right-4 bottom-4 h-6 w-6 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}
