import BlueButton from "../BlueButton";

export default function Unauthenticated() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full gap-4">
      <h1 className="text-2xl font-extrabold text-red-600 text-center">Acceso no autorizado</h1>
      <p className="text-gray-600 text-center text-[14px]">Por favor, inicia sesión nuevamente.</p>
      <div className=" w-40">
        <BlueButton href="/" name="Volver al inicio" />
      </div>
    </div>
  );
}
