interface ErrorMessageProps {
  errorMessage: string;
}

export default function ErrorMessage({ errorMessage }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center w-full h-full my-10">
      {errorMessage}
    </div>
  );
}