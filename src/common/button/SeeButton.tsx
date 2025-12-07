import { FaEye } from "react-icons/fa6";
import ActionButton from "../../components/ActionButton";

interface SeeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function SeeButton({ onClick, disabled }: SeeButtonProps) {
  return (
    <ActionButton
      icon={<FaEye className="size-4" />}
      onClick={onClick}
      disabled={disabled}
      bgColor="#252525ff"
      bgHoverColor="#000000"
    />
  )
}
