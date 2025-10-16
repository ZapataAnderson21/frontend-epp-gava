interface ButtonContainerProps {
  children: React.ReactNode;
}

export default function ButtonContainer({ children }: ButtonContainerProps) {
  return (
    <div className="flex flex-row w-full items-center justify-start gap-2 mt-2 text-white font-semibold">
      {children}
    </div>
  )
}
