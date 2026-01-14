import { InputForm } from "../../../../../../../common/form";

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
        <InputForm name="dniCarePerson" label="DNI" type="text" value={dniCarePerson} onChange={(e) => { const v = e.target.value; if (/^\d{0,8}$/.test(v)) setDniCarePerson(v); }} maxLength={8} error={dniError} />
        <InputForm name="observations" label="Observación" type="text" value={observations} onChange={(e) => setObservations(e.target.value)} optional={true} />
      </div>
    </div>
  );
}
