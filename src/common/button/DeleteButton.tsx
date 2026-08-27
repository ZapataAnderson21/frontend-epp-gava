import { Trash2 as FaTrashAlt } from "lucide-react";
import ActionButton from "../../components/ActionButton";

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function DeleteButton({ onClick, disabled }: DeleteButtonProps) {
  return (
    <ActionButton
      icon={<FaTrashAlt />}
      onClick={onClick}
      disabled={disabled}
      bgColor="#d80027"
      bgHoverColor="#c80008"
    />
  )
}
