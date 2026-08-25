import { LoaderCircle as AiOutlineLoading, Save as FaSave } from "lucide-react";
import { Button } from "../../components";


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
