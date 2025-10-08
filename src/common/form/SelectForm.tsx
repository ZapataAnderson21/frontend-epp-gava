import { IoMdArrowDropdown } from "react-icons/io";
import { useState } from "react";

type Primitive = string | number;

interface Option<T extends Primitive = string> {
  value: T;
  label: string;
}

interface SelectFormProps<T extends Primitive = string> {
  label: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  directionRow?: boolean;
}

export default function SelectForm<T extends Primitive = string>({
  label, name, value, onChange, options, directionRow
}: SelectFormProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label ?? "";

  return (
    <div className="flex flex-col w-full">
      <div className={`flex ${directionRow ? "flex-row items-center text-nowrap" : "flex-col"} gap-2`}>
        <label className="text-gray-700 font-bold" htmlFor={name}>{label}</label>
        <div className="relative">
          <button type="button" onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between border border-gray-400 min-w-[180px] p-2 rounded-sm focus:border focus:border-[#0047a3]">
            {selectedLabel || "Seleccionar ..."}
            <IoMdArrowDropdown className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 z-10 w-full bg-white border border-gray-200 rounded-md shadow-md" id={name}>
              {options.map((option) => (
                <div key={String(option.value)}
                  onClick={() => { onChange(option.value); setIsOpen(false); }}
                  className={`px-3 py-1 hover:bg-[#eff2ff] hover:text-[#0047a3] cursor-pointer ${
                    value === option.value ? "bg-[#eff2ff] font-semibold text-[#0047a3]" : ""
                  }`}>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
