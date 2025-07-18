export default function StatesList() {
  
  const StatesList = [
    { color: "bg-gray-500", label: "Borrador" },
    { color: "bg-orange-400", label: "En progreso" },
    { color: "bg-yellow-500", label: "Revisado" },
    { color: "bg-green-500", label: "Aprobado" },
    { color: "bg-red-500", label: "Rechazado" },
    { color: "bg-blue-500", label: "Atendido" },
    { color: "bg-purple-500", label: "Culminado" },
  ];
  
  return (

    <div className="absolute left-24 top-[-8px] flex flex-row flex-wrap items-center justify-center gap-4 text-[12px] font-semibold shadow-md bg-sky-50 rounded-md px-4 pt-4 pb-3">
      {StatesList.map((state) => (
        <div key={state.label} className="flex flex-col items-center justify-start gap-2">
          <div className={`${state.color} border-1 size-3 rounded-full`}></div>
          <p>{state.label}</p>
        </div>
      ))}
    </div>
  );
}