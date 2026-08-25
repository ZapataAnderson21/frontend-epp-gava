import { Pencil as FaPencil } from "lucide-react";
import ActionButton from "../../components/ActionButton";

interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function EditButton({ onClick, disabled }: EditButtonProps) {
  return (
    <ActionButton
      icon={<FaPencil className="size-4" />}
      onClick={onClick}
      disabled={disabled}
      bgColor="#fbbf24"
      bgHoverColor="#f59e0b"
    />
  )
}
