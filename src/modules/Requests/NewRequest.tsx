import { useState } from "react";
import RedButton from "../../RedButton";

interface EPPInput {
  id: number;
  epp: string;
  quantity: number;
  user: string;
}

export default function NewRequest() {
  const [eppInputs, setEppInputs] = useState<EPPInput[]>([
    { id: Date.now(), epp: "", quantity: 1, user: "" },
  ]);

  const handleAddEPP = () => {
    setEppInputs([
      ...eppInputs,
      { id: Date.now(), epp: "", quantity: 1, user: "" },
    ]);
  };

  const handleRemoveEPP = (id: number) => {
    setEppInputs(eppInputs.filter((input) => input.id !== id));
  };

  const handleChange = (
    index: number,
    field: keyof EPPInput,
    value: string | number
  ) => {
    const updated = [...eppInputs];

    if (field === "quantity") {
      updated[index][field] = parseInt(value as string, 10) as any;
    } else if (field === "epp" || field === "user") {
      updated[index][field] = value as string;
    }

    setEppInputs(updated);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const input of eppInputs) {
      if (input.quantity <= 0) {
        alert("La cantidad debe ser mayor a 0");
        return;
      }
    }
    // Aquí enviarías los datos al backend
    console.log("Enviando solicitud:", eppInputs);
  };

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
        <h1 className="text-2xl font-bold mb-4">REGISTRAR SOLICITUD</h1>
      </div>

      <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-[14px] text-gray-600">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
          {eppInputs.map((input, index) => (
            <div key={input.id} className="flex flex-col gap-2 border-b border-gray-300 pb-4">
              <div className="flex flex-row items-start justify-between gap-2">
                <div className="w-full flex flex-col gap-2">
                  <label htmlFor={`epp-${input.id}`} className="font-semibold">Seleccionar EPP</label>
                  <select
                    id={`epp-${input.id}`}
                    className="w-full border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]"
                    value={input.epp}
                    onChange={(e) => handleChange(index, "epp", e.target.value)}
                    required
                  >
                    <option value="">-- Selecciona --</option>
                    <option value="Botas con punta de acero">Botas con punta de acero</option>
                    <option value="Guantes">Guantes</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor={`quantity-${input.id}`} className="font-semibold">Cantidad</label>
                  <input
                    type="number"
                    id={`quantity-${input.id}`}
                    className="border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3] w-[80px]"
                    placeholder="Cantidad"
                    min={1}
                    value={input.quantity}
                    onChange={(e) => handleChange(index, "quantity", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor={`user-${input.id}`} className="font-semibold">Para:</label>
                <select
                  id={`user-${input.id}`}
                  className="w-full border border-gray-400 p-2 rounded-sm focus:outline-[#0047a3]"
                  value={input.user}
                  onChange={(e) => handleChange(index, "user", e.target.value)}
                  required
                >
                  <option value="">-- Selecciona --</option>
                  <option value="José Rodriguez Vega">José Rodriguez Vega</option>
                  <option value="Leoncio Pérez Ruiz">Leoncio Pérez Ruiz</option>
                </select>
              </div>
              {eppInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveEPP(input.id)}
                  className="self-end text-white bg-red-600 px-3 py-2 rounded-sm text-[12px] cursor-pointer hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddEPP}
            className="bg-black text-white px-4 py-2 rounded-md shadow-sm hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Agregar EPP
          </button>

          <div className="flex flex-row items-center justify-center gap-2 mt-2 text-white font-semibold">
            <RedButton href="/admin/requests" name="Cancelar" />
            <button
              type="submit"
              className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm hover:bg-[#003a80] transition-colors cursor-pointer"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
