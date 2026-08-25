import type { ReactNode } from "react";

interface ColumnCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode
}

export default function ColumnCard ({ title, children, action }: ColumnCardProps) {
  return(  
    <div className="flex flex-col w-full bg-white border border-gray-50 rounded-xl p-5 shadow-sm h-full">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h3 className="text-lg font-extrabold text-gray-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}