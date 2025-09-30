interface FormProps {
  name: string;
  children: React.ReactNode;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export default function Form({ name, children, handleSubmit }: FormProps) {
  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
        <h1 className="text-2xl font-bold mb-4">{name}</h1>
      </div>
      <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-gray-600">
        <form className="flex flex-col gap-4 w-full max-w-2xl" onSubmit={handleSubmit}>
          {children}
        </form>
      </div>
    </div>
  )
}
