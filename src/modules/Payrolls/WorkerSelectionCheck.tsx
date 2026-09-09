import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";

interface Props {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onChange: (checked: boolean) => void;
}

export default function WorkerSelectionCheck({
  checked,
  indeterminate = false,
  disabled = false,
  ariaLabel,
  onChange,
}: Props) {
  const active = checked || indeterminate;

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      onClick={() => onChange(!checked)}
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
        active
          ? "border-[#0047a3] bg-[#0047a3] text-white shadow-sm"
          : "border-gray-300 bg-white text-transparent hover:border-[#0047a3] hover:bg-[#eff5ff]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <motion.span
        key={indeterminate ? "mixed" : checked ? "checked" : "empty"}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 24 }}
      >
        {indeterminate ? (
          <Minus className="size-4" strokeWidth={3} />
        ) : (
          <Check className={`size-4 ${checked ? "" : "opacity-0"}`} strokeWidth={3} />
        )}
      </motion.span>
    </motion.button>
  );
}
