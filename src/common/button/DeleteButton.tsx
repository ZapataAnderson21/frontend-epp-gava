import { FaTrash } from "react-icons/fa6";
import ActionButton from "../../components/ActionButton";

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function DeleteButton({ onClick, disabled }: DeleteButtonProps) {
  return (
    <ActionButton
      icon={<FaTrash />}
      onClick={onClick}
      disabled={disabled}
      bgColor = "#d80027"
      bgHoverColor = "#c80008"
    />
  )
}
