interface ForgotPasswordModalProps {
  email: string;
  onClick: () => void;
}

export default function ForgotPasswordModal({ email, onClick }: ForgotPasswordModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">
          Recuperación de contraseña
        </h2>
        <p className="text-gray-700 mb-4 text-center">
          Se ha enviado un correo electrónico a {email} con las instrucciones
          para ayudarle a recuperar su contraseña.
        </p>
        <button
          onClick={onClick}
          className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003366] cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
