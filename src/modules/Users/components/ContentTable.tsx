import RowTable from "./RowTable";

export default function ContentTable() {
  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[13px] md:text-[14px]">
      <RowTable id={1} name="Henry" lastname="Gayoso Valdera" rol="Gerente" />
      <RowTable id={2} name="Angi" lastname="Gonzales Cotrina" rol="Administradora" />
      <RowTable id={3} name="Carlos" lastname="Yovera Díaz" rol="Ingeniero" />
      <RowTable id={4} name="Lucía" lastname="Herrera Campos" rol="Ingeniera" />
      <RowTable id={5} name="Manuel" lastname="Rivas Quispe" rol="Obrero" />
      <RowTable id={6} name="Esteban" lastname="Salazar Ruiz" rol="Obrero" />
      <RowTable id={7} name="Rosa" lastname="Cárdenas Pérez" rol="Obrera" />
      <RowTable id={8} name="Julio" lastname="Ramos Medina" rol="Obrero" />
      <RowTable id={9} name="Diana" lastname="Torres Aliaga" rol="Ingeniera" />
      <RowTable id={10} name="Miguel" lastname="Chávez Soto" rol="Obrero" />
    </div>
  );
}
