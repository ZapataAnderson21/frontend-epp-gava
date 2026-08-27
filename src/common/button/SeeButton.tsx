import { Eye as FaEye } from "lucide-react";
import ActionButton from "../../components/ActionButton";

interface SeeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function SeeButton({ onClick, disabled }: SeeButtonProps) {
  return (
    <ActionButton
      icon={<FaEye />}
      onClick={onClick}
      disabled={disabled}
      bgColor="#252525ff"
      bgHoverColor="#000000"
    />
  )
}
