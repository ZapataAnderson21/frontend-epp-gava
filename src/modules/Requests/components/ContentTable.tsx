import RowTable from "./RowTable";

export default function ContentTable() {
  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
      <RowTable id={1} date="2023-10-01" status="Pendiente" user="Juan Perez" />
      <RowTable id={2} date="2023-10-02" status="Aprobada" user="Maria Gomez" />
      <RowTable id={3} date="2023-10-03" status="Rechazada" user="Pedro Martinez" />
      <RowTable id={4} date="2023-10-04" status="Pendiente" user="Ana Torres" />
      <RowTable id={5} date="2023-10-05" status="Aprobada" user="Luis Ramirez" />
      <RowTable id={6} date="2023-10-06" status="Rechazada" user="Sofia Lopez" />
      <RowTable id={7} date="2023-10-07" status="Pendiente" user="Carlos Sanchez" />
      <RowTable id={8} date="2023-10-08" status="Aprobada" user="Laura Diaz" />
      <RowTable id={9} date="2023-10-09" status="Rechazada" user="Javier Morales" />
      <RowTable id={10} date="2023-10-10" status="Pendiente" user="Elena Ruiz" />
    </div>
  );
}