import { FaSave } from "react-icons/fa";
import { Button } from "../../components";
import { AiOutlineLoading } from "react-icons/ai";

interface SaveButtonProps {
  loading: boolean;
}

export default function SaveButton({ loading }: SaveButtonProps) {
  return (
    <Button
      icon={loading ? <AiOutlineLoading className="animate-spin" /> : <FaSave />}
      label={loading ? "Guardando..." : "Guardar"}
      type="submit"
      bgColor="#0047a3" 
      bgHoverColor="#003366"
    />
  )
}
