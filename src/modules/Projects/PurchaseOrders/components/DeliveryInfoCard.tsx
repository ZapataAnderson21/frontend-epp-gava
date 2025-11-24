import { InputForm } from "../../../../common/form";

interface Props {
  destination: string;
  setDestination: (v: string) => void;
  deliveryLocation: string;
  setDeliveryLocation: (v: string) => void;
  carePerson: string;
  setCarePerson: (v: string) => void;
  dniCarePerson: string;
  setDniCarePerson: (v: string) => void;
  observations: string;
  setObservations: (v: string) => void;
  dniError?: string;
}

export default function DeliveryInfoCard({
  destination, setDestination,
  deliveryLocation, setDeliveryLocation,
  carePerson, setCarePerson,
  dniCarePerson, setDniCarePerson,
  observations, setObservations,
  dniError
}: Props) {
  return (
    <div className="grid-cols-1 flex flex-col h-full">
      <h1 className="text-xl font-bold">DATOS PARA ENTREGA O ENVÍO</h1>
      <div className="flex flex-col gap-4 p-4 shadow-md shadow-gray-300 h-full">
        <InputForm name="destination" label="Destino" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <InputForm name="deliveryLocation" label="Lugar de entrega" type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} />
        <InputForm name="carePerson" label="Atención" type="text" value={carePerson} onChange={(e) => setCarePerson(e.target.value)} />
        <div className="flex flex-col gap-1">
          <div className="flex flex-row flex-wrap gap-2">
            <label className="font-semibold text-nowrap" htmlFor="dniCarePerson">DNI:</label>
            <input
              id="dniCarePerson"
              className={`cursor-text border ${dniError ? "border-red-600" : "border-gray-400"} text-gray-900 text-sm rounded-sm focus:outline-[#0047a3] block w-full p-2.5`}
              maxLength={8}
              value={dniCarePerson}
              onChange={(e) => { const v = e.target.value; if (/^\d{0,8}$/.test(v)) setDniCarePerson(v); }}
              required
            />
          </div>
          {dniError && <p className="text-xs text-red-600">{dniError}</p>}
        </div>
        <InputForm name="observations" label="Observación" type="text" value={observations} onChange={(e) => setObservations(e.target.value)} optional={true} />
      </div>
    </div>
  );
}
