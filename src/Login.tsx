export default function Login() {

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen sm:bg-gray-100">
        <div className="bg-white px-8 py-12 rounded-lg sm:shadow-md w-full max-w-md">
          <div className="flex flex-row items-center justify-center gap-4 w-full mb-8">
            <img src="/buho-gava.webp" alt="Logo-Buho" className="h-16" />
            <img src="/logo-gava.png" alt="Logo" className="h-16" />          
          </div>
          <div className="flex flex-col gap-2 items-start justify-center mb-6">
            <p className="text-gray-700 font-bold">Correo:</p>
            <input type="text" className="border border-gray-300 p-2 rounded-md w-full focus:outline-[#0047a3]" />
          </div>
          <div className="flex flex-col gap-2 items-start justify-center mb-6">
            <p className="text-gray-700 font-bold">Contraseña:</p>
            <input type="password" className="border border-gray-300 p-2 rounded-md w-full focus:outline-[#0047a3]" />
          </div>
          <div className="flex flex-row gap-4 items-center justify-start">
            <a href="/admin">
              <button className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003366] cursor-pointer hover:scale-[101%] font-bold">Iniciar sesión</button>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

