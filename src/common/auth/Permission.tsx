import React from "react";
import type { User } from "../../data/types";
import { useAccess } from "../../permissions/AccessProvider";

type Props = {
  user?: User | null;
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export default function Permission({
  permission,
  fallback = null,
  children,
}: Props) {
  const { can } = useAccess();
  const ok = can(permission);
  return <>{ok ? children : fallback}</>;
}
