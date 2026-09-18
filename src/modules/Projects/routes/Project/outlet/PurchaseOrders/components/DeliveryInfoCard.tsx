import { InputForm } from "../../../../../../../common/form";
import Select from "../../../../../../../components/Select";
import { workerApi } from "../../../../../../../data/apiUrl";
import type { Worker } from "../../../../../../../data/types";
import { useFetch } from "../../../../../../../hooks/useFetch";

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
  const { data: workers, loading, error, refetch } = useFetch<Worker[]>(workerApi);
  const availableWorkers = (workers ?? []).filter(worker => !worker.deletedAt);
  const selectedWorker = availableWorkers.find(worker =>
    worker.fullName === carePerson && worker.dni === dniCarePerson,
  );
  // Preserve historical values and restored drafts until the user chooses a worker.
  const hasSavedContact = Boolean(carePerson || dniCarePerson);
  const selectedValue = selectedWorker ? String(selectedWorker.workerId) : hasSavedContact ? "saved" : "";
  const options = [
    { value: "", label: "Seleccionar trabajador..." },
    ...(hasSavedContact && !selectedWorker
      ? [{ value: "saved", label: `${carePerson || "Atención guardada"}${dniCarePerson ? ` — ${dniCarePerson}` : ""} (guardado)`, disabled: true }]
      : []),
    ...availableWorkers.map(worker => ({
      value: String(worker.workerId),
      label: `${worker.fullName} — ${worker.dni}`,
    })),
  ];

  const selectWorker = (value: string) => {
    if (value === "") {
      setCarePerson("");
      setDniCarePerson("");
      return;
    }
    const worker = availableWorkers.find(item => String(item.workerId) === value);
    if (!worker) return;
    setCarePerson(worker.fullName);
    setDniCarePerson(worker.dni);
  };

  return (
    <div className="grid-cols-1 flex flex-col h-full">
      <h1 className="text-lg font-bold">DATOS PARA ENTREGA O ENVÍO</h1>
      <div className="flex flex-col gap-4 p-4 shadow-md shadow-gray-300 h-full">
        <InputForm name="destination" label="Destino" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <InputForm name="deliveryLocation" label="Lugar de entrega" type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} />
        <div className="flex flex-col gap-2">
          <label htmlFor="carePerson" className="font-semibold">Atención</label>
          <Select id="carePerson" name="carePerson" ariaLabel="Atención" value={selectedValue} onChange={selectWorker} options={options} disabled={loading || Boolean(error)} staggerMs={0} />
          {loading && <p className="text-sm text-gray-500" role="status">Cargando trabajadores...</p>}
          {error && <div className="text-sm text-red-600" role="alert">No se pudieron cargar los trabajadores: {error} <button type="button" onClick={refetch} className="underline">Reintentar</button></div>}
          {!loading && !error && workers && availableWorkers.length === 0 && <p className="text-sm text-gray-500">No hay trabajadores disponibles.</p>}
        </div>
        <InputForm name="dniCarePerson" label="DNI" type="text" value={dniCarePerson} onChange={() => {}} readOnly error={dniError} />
        <InputForm name="observations" label="Observación" type="text" value={observations} onChange={(e) => setObservations(e.target.value)} optional={true} />
      </div>
    </div>
  );
}
