import RowTable from "./RowTable";

export default function ContentTable() {
  return (
    <div className="flex flex-col items-center justify-between w-full px-2 text-[13px] md:text-[14px]">
      <RowTable id={1} name="Casco de seguridad" type="Protección craneal" description="Protección ante impactos en la cabeza" />
      <RowTable id={2} name="Guantes dieléctricos" type="Protección eléctrica" description="Aislamiento frente a corriente" />
      <RowTable id={3} name="Botas con punta de acero" type="Protección para pies" description="Evita lesiones por caída de objetos" />
      <RowTable id={4} name="Arnés de seguridad" type="Trabajo en altura" description="Prevención de caídas" />
      <RowTable id={5} name="Lentes de seguridad" type="Protección ocular" description="Contra partículas y polvo" />
      <RowTable id={6} name="Mascarilla con filtro" type="Protección respiratoria" description="Filtrado de partículas o vapores" />
      <RowTable id={7} name="Overol ignífugo" type="Ropa de protección" description="Resistente al fuego y al arco eléctrico" />
      <RowTable id={8} name="Orejeras / tapones auditivos" type="Protección auditiva" description="Reduce la exposición al ruido" />
      <RowTable id={9} name="Chaleco reflectante" type="Alta visibilidad" description="Mayor visibilidad en zonas de riesgo" />
      <RowTable id={10} name="Polainas / cubrebotas" type="Protección adicional" description="Contra chispas, químicos o soldadura" />
    </div>
  );
}
