import { motion } from "framer-motion";
import { useAccess } from "../permissions/AccessProvider";

interface ActionButtonProps {
  icon: React.ReactNode;
  bgColor: string;
  bgHoverColor: string;
  onClick?: () => void;
  disabled?: boolean;
  permission?: string;
}

export default function ActionButton({
  icon,
  onClick,
  disabled,
  bgColor,
  bgHoverColor,
  permission,
}: ActionButtonProps) {
  const { can } = useAccess();
  if (permission && !can(permission)) return null;
  return (
    <motion.button
      onClick={onClick}
      type="button"
      style={{ backgroundColor: bgColor }}
      className={`cursor-pointer flex gap-2 justify-center items-center border p-2 rounded-xl 
          border-gray-100 text-white w-fit 
          hover:scale-[105%] duration-300 disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0`}
      whileHover={{ backgroundColor: bgHoverColor }}
      disabled={disabled}
    >
      {icon}
    </motion.button>
  );
}
