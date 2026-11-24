import { Eye as FaEye } from "lucide-react";
import ActionButton from "../../components/ActionButton";

interface SeeButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  permission?: string;
}

export default function SeeButton({
  onClick,
  disabled,
  label = "Visualizar",
  permission,
}: SeeButtonProps) {
  return (
    <ActionButton
      icon={<FaEye />}
      label={label}
      onClick={onClick}
      disabled={disabled}
      permission={permission}
      variant="ghost"
    />
  );
}
