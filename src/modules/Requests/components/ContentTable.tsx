import RowTable from "./RowTable";

export default function ContentTable() {
  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
      <RowTable id={1} dateTime="10-01 a las 10:00" status="Pendiente" user="Juan Perez" />
      <RowTable id={2} dateTime="10-02 a las 11:00" status="Atendido" user="Maria Gomez" />
      <RowTable id={3} dateTime="10-03 a las 12:00" status="Rechazado" user="Pedro Martinez" />
      <RowTable id={4} dateTime="10-04 a las 13:00" status="Pendiente" user="Ana Torres" />
      <RowTable id={5} dateTime="10-05 a las 14:00" status="Atendido" user="Luis Ramirez" />
      <RowTable id={6} dateTime="10-06 a las 15:00" status="Rechazado" user="Sofia Lopez" />
      <RowTable id={7} dateTime="10-07 a las 16:00" status="Pendiente" user="Carlos Sanchez" />
      <RowTable id={8} dateTime="10-08 a las 17:00" status="Atendido" user="Laura Diaz" />
      <RowTable id={9} dateTime="10-09 a las 18:00" status="Rechazado" user="Javier Morales" />
      <RowTable id={10} dateTime="10-10 a las 19:00" status="Pendiente" user="Elena Ruiz" />
    </div>
  );
}