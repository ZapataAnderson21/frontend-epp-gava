import React from "react";

interface RowTableProps<T> {
  item: T;
  order: number;
  href: string;
  renderCells: (item: T, order: number) => React.ReactNode[];
}

export default function RowTable<T>({
  item,
  order,
  href,
  renderCells,
}: RowTableProps<T>) {
  return (
    <a href={`${href}`} className="min-w-full">
      <div
        className={`${
          order % 2 === 0 ? "bg-gray-50" : "bg-white"
        } flex flex-row items-center justify-between w-full p-4 pl-6 border-b border-gray-200 
        gap-4 hover:bg-[#eff2ff] cursor-pointer`}
      >
        {renderCells(item, order).map((cell, idx) => (
          <span key={idx} className="flex items-start justify-start">
            {cell}
          </span>
        ))}
      </div>
    </a>
  );
}
