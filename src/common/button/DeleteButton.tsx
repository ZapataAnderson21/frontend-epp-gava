import { Trash2 as FaTrashAlt } from "lucide-react";
import ActionButton from "../../components/ActionButton";
import { useModuleAction } from "../../permissions/AccessProvider";

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
  permission?: string;
  label?: string;
}

export default function DeleteButton({
  onClick,
  disabled,
  permission,
  label = "Eliminar",
}: DeleteButtonProps) {
  const allowed = useModuleAction("delete", permission);
  if (!allowed) return null;
  return (
    <ActionButton
      icon={<FaTrashAlt />}
      label={label}
      onClick={onClick}
      disabled={disabled}
      variant="ghost"
      tone="danger"
    />
  );
}
