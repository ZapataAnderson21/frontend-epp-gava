import RedButton from "../components/RedButton";
import ErrorMessage from "./ErrorMessage";

interface ErrorWithButtonProps {
  errorMessage: string;
  href: string;
}

export default function ErrorWithButton({ errorMessage, href }: ErrorWithButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <ErrorMessage errorMessage={errorMessage} />
      <div className="max-w-fit">
        <RedButton href={href} name="Regresar" />
      </div>
    </div>
  );
}