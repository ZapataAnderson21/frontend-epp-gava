import { FaEye } from "react-icons/fa6";
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
      bgColor="oklch(27.9% 0.041 260.031)"
      bgHoverColor="#000000"
    />
  )
}
