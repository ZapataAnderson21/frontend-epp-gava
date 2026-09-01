import Permission from "../../../../../../../common/auth/Permission";
import { useCurrentUser } from "../../../../../../../hooks";
import { adminTypes, logisticsTypes } from "../../../../../../../utils";
import NavbarItemProject from "./NavbarItemProject";

export default function NavbarProject() {
  const { user } = useCurrentUser();
  
  return (
    <div className="relative flex flex-row gap-4 overflow-auto text-nowrap w-full min-h-12 mb-6 z-10">
      <NavbarItemProject to='' name="Resumen" />
      
      <Permission user={user} allow={logisticsTypes}>  
        <NavbarItemProject to='purchase-orders' name="Órdenes de Compra" />
      </Permission>  
      
      <NavbarItemProject to='requests' name="Requerimientos" />
      <NavbarItemProject to='inventory' name="Inventario" />

      <Permission user={user} allow={adminTypes}>
        <NavbarItemProject to='incomes' name="Ingresos" />
      </Permission>
      
      <Permission user={user} allow={logisticsTypes}>
        <NavbarItemProject to='petty-cash' name="Caja Chica" />
      </Permission>
      
      <NavbarItemProject to='emergencies' name="Emergencias" />
      
      <Permission user={user} allow={logisticsTypes}>
        <NavbarItemProject to='payrolls' name="Planillas / Asistencias" />
      </Permission>
      
      <NavbarItemProject to='progress' name="Avance" />
      
      <div className="w-full border-b border-gray-300 absolute bottom-0"></div>
    </div>
  );
}
