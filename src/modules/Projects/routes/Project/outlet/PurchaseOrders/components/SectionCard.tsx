import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function SectionCard({ title, children, className = "" }: SectionCardProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-[#14519d] text-white p-4 border border-[#14519d]">
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <div className="flex flex-col gap-4 p-4 shadow-md border border-gray-300 h-full">
        {children}
      </div>
    </div>
  );
}
