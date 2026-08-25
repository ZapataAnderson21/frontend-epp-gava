import { Trash2 as FaTrashAlt } from "lucide-react";
import ActionButton from "../../components/ActionButton";

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function DeleteButton({ onClick, disabled }: DeleteButtonProps) {
  return (
    <ActionButton
      icon={<FaTrashAlt className="size-4" />}
      onClick={onClick}
      disabled={disabled}
      bgColor="#d80027"
      bgHoverColor="#c80008"
    />
  )
}
