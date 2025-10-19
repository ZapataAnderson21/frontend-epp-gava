import React from "react";
import type { User } from "../../data/types";

type Props = {
  user: User | null;
  allow: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export default function Permission({ user, allow, fallback = null, children }: Props) {
  if (!user?.userType) return <>{fallback}</>;
  const ok = allow.includes(user.userType);
  return <>{ok ? children : fallback}</>;
}
