import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

/** Read-only attendance: a tap reveals its project, never toggles a day. */
export default function AttendanceIndicator({
  checked,
  projectNames,
  label,
}: {
  checked: boolean;
  projectNames: string[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const description = checked
    ? projectNames.join(" · ") || "Proyecto no disponible"
    : "No asistió";

  useLayoutEffect(() => {
    if (!open || !trigger.current || !tooltip.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    const bubble = tooltip.current.getBoundingClientRect();
    const margin = 8;
    const below = anchor.bottom + margin;
    setPosition({
      left: Math.max(
        margin,
        Math.min(
          anchor.left + anchor.width / 2 - bubble.width / 2,
          window.innerWidth - bubble.width - margin,
        ),
      ),
      top: Math.max(
        margin,
        below + bubble.height <= window.innerHeight - margin
          ? below
          : anchor.top - bubble.height - margin,
      ),
    });
  }, [open, description]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !trigger.current?.contains(event.target) &&
        !tooltip.current?.contains(event.target)
      )
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const show = () => {
    if (open) return;
    setPosition(null);
    setOpen(true);
  };
  return (
    <>
      <motion.button
        ref={trigger}
        type="button"
        aria-label={`${label}: ${checked ? "Asistió" : "No asistió"}`}
        aria-describedby={open ? tooltipId : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") show();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setOpen(false);
        }}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) show();
        }}
        onBlur={() => setOpen(false)}
        onClick={show}
        initial={false}
        animate={{ scale: checked ? 1 : 0.94 }}
        transition={{ type: "spring", stiffness: 460, damping: 24 }}
        className={`mx-auto inline-flex size-8 cursor-help touch-manipulation items-center justify-center rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047a3] ${checked ? "border-[#0047a3] bg-[#0047a3] text-white shadow-sm" : "border-gray-200 bg-white text-transparent"}`}
      >
        <Check className="size-5" strokeWidth={3} aria-hidden="true" />
      </motion.button>
      {open &&
        createPortal(
          <div
            ref={tooltip}
            id={tooltipId}
            role="tooltip"
            className="fixed z-[10000] w-max max-w-[min(320px,calc(100vw-16px))] break-words rounded-lg bg-[#0f2545] px-3 py-2 text-center text-sm font-medium leading-relaxed text-white shadow-lg"
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
          >
            {description}
          </div>,
          document.body,
        )}
    </>
  );
}
