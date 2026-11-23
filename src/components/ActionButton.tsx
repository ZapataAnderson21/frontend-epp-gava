import { motion } from "framer-motion";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useAccess } from "../permissions/AccessProvider";

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  bgColor?: string;
  bgHoverColor?: string;
  onClick?: () => void;
  disabled?: boolean;
  permission?: string;
  variant?: "solid" | "ghost";
  tone?: "primary" | "danger";
  pressed?: boolean;
}

interface TooltipPosition {
  left: number;
  top: number;
  placement: "top" | "bottom";
}

export default function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  bgColor = "#0047a3",
  bgHoverColor = "#00377f",
  permission,
  variant = "solid",
  tone = "primary",
  pressed,
}: ActionButtonProps) {
  const { can } = useAccess();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    left: 0,
    top: 0,
    placement: "top",
  });

  useLayoutEffect(() => {
    if (!showTooltip || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const placement = rect.top >= 48 ? "top" : "bottom";
      setTooltipPosition({
        left: Math.min(
          Math.max(rect.left + rect.width / 2, 56),
          window.innerWidth - 56,
        ),
        top: placement === "top" ? rect.top - 8 : rect.bottom + 8,
        placement,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showTooltip]);

  if (permission && !can(permission)) return null;

  const isGhost = variant === "ghost";
  const ghostToneClasses =
    tone === "danger"
      ? "text-[#0047a3]/80 hover:bg-red-50 hover:text-red-700"
      : "text-[#0047a3]/80 hover:bg-[#0047a3]/10 hover:text-[#0047a3]";

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={onClick}
        type="button"
        aria-label={label}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-pressed={pressed}
        style={isGhost ? undefined : { backgroundColor: bgColor }}
        className={
          isGhost
            ? `inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent p-0 shadow-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047a3] focus-visible:ring-offset-2 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#0047a3]/80 [&_svg]:size-4 [&_svg]:shrink-0 ${ghostToneClasses} ${pressed ? "bg-[#0047a3]/10 text-[#0047a3]" : ""}`
            : "flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-100 p-2 text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047a3] focus-visible:ring-offset-2 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0"
        }
        whileHover={isGhost || disabled ? undefined : { backgroundColor: bgHoverColor }}
        disabled={disabled}
        onPointerEnter={() => setShowTooltip(true)}
        onPointerLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setShowTooltip(false);
        }}
      >
        <span aria-hidden="true">{icon}</span>
      </motion.button>

      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-[1000] max-w-52 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-center text-xs font-medium leading-4 text-white shadow-lg"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              transform:
                tooltipPosition.placement === "top"
                  ? "translate(-50%, -100%)"
                  : "translate(-50%, 0)",
            }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
