import NavbarItemProject from "./NavbarItemProject";

export default function NavbarProject() {

  return (
    <div className="relative flex flex-row gap-4 overflow-auto text-nowrap w-full min-h-12 mb-6 z-10">
      <NavbarItemProject to='' name="Resumen" />
      <NavbarItemProject to='purchase-orders' name="Órdenes de Compra" />
      <NavbarItemProject to='requests' name="Requerimientos" />
      <NavbarItemProject to='petty-cash' name="Caja Chica" />
      <NavbarItemProject to='emergencies' name="Emergencias" />
      <NavbarItemProject to='payrolls' name="Planillas / Asistencias" />
      <NavbarItemProject to='progress' name="Avance" />
      <div className="w-full border-b border-gray-300 absolute bottom-0"></div>
    </div>
  );
}