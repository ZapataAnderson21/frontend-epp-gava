import { Pencil as FaPencil } from "lucide-react";
import ActionButton from "../../components/ActionButton";
import { useModuleAction } from "../../permissions/AccessProvider";

interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
  permission?: string;
}

export default function EditButton({
  onClick,
  disabled,
  permission,
}: EditButtonProps) {
  const allowed = useModuleAction("manage", permission);
  if (!allowed) return null;
  return (
    <ActionButton
      icon={<FaPencil />}
      onClick={onClick}
      disabled={disabled}
      bgColor="#fbbf24"
      bgHoverColor="#f59e0b"
    />
  );
}
