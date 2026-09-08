import { Trash2 as FaTrashAlt } from "lucide-react";
import ActionButton from "../../components/ActionButton";
import { useModuleAction } from "../../permissions/AccessProvider";

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
  permission?: string;
}

export default function DeleteButton({
  onClick,
  disabled,
  permission,
}: DeleteButtonProps) {
  const allowed = useModuleAction("delete", permission);
  if (!allowed) return null;
  return (
    <ActionButton
      icon={<FaTrashAlt />}
      onClick={onClick}
      disabled={disabled}
      bgColor="#d80027"
      bgHoverColor="#c80008"
    />
  );
}
