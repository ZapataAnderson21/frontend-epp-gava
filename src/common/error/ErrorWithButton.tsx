import { useNavigate } from "react-router-dom";
import { ReturnButton } from "../button";
import ErrorMessage from "./ErrorMessage";

interface ErrorWithButtonProps {
  errorMessage: string;
  href: string;
}

export default function ErrorWithButton({ errorMessage, href }: ErrorWithButtonProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <ErrorMessage errorMessage={errorMessage} />
      <div className="max-w-fit">
        <ReturnButton onClick={() => navigate(href)} />
      </div>
    </div>
  );
}