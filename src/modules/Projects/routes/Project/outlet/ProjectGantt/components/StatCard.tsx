import type React from "react";

interface StatCardProps {
  label: string;
  bgColor: string;
  color: string;
  value: number | string;
  icon: React.ReactNode;
  highlight?: boolean;
}

export default function StatCard({ label, bgColor, color, value, icon, highlight }: StatCardProps) {
  return (
    <div
      key={label}
      style={{backgroundColor: bgColor}}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        highlight ? "ring-2 ring-red-300" : ""
      }`}
    >
      {icon}
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}