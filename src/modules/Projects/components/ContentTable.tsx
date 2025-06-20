import RowTable from "./RowTable";

export default function ContentTable() {
  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[12px] md:text-[14px]">
      <RowTable id={1} name="SIMBILÁ VERDE I" code="LOG-214" status="Activo" />
      <RowTable id={2} name="Estancia VIII" code="LOG-214" status="Finalizado" />
      <RowTable id={3} name="Estancia del Valle IV" code="LOG-214" status="Activo" />
      <RowTable id={4} name="Estancia del Valle IV" code="LOG-214" status="Finalizado" />
      <RowTable id={5} name="Estancia del Valle IV" code="LOG-214" status="Activo" />
      <RowTable id={6} name="Estancia del Valle IV" code="LOG-214" status="Finalizado" />
      <RowTable id={7} name="Estancia del Valle IV" code="LOG-214" status="Activo" />
      <RowTable id={8} name="Estancia del Valle IV" code="LOG-214" status="Finalizado" />
      <RowTable id={9} name="Estancia del Valle IV" code="LOG-214" status="Finalizado" />
      <RowTable id={10} name="Estancia del Valle IV" code="LOG-214" status="Activo" />
    </div>
  );
}