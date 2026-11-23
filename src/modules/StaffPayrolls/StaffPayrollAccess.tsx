import type { ReactNode } from "react";
import { useAccess } from "../../permissions/AccessProvider";

export default function StaffPayrollAccess({
  children,
}: {
  children: ReactNode;
}) {
  const { can } = useAccess();
  if (!can("staffPayroll.view") || !can("finance.view")) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-lg font-bold">Acceso restringido</h1>
        <p className="mt-1 text-sm">
          Esta información requiere permisos de planillas STAFF e información
          económica.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
