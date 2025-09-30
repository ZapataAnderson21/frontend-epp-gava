import { IoMdArrowDropdown } from "react-icons/io";
import { useState } from "react";

interface OptionsSelect {
  value: string | number;
  label: string;
} 

interface SelectFormProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string | number) => void;   // 👈 cambia esto
  options: OptionsSelect[];
}


export default function SelectForm({ label, name, onChange, options }: SelectFormProps) {
  // Add this state and handler before the return
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<OptionsSelect>(options[0] || { value: '', label: '' });

  const handleOptionClick = (option: OptionsSelect) => {
    setSelected(option);
    setIsOpen(false);
    onChange(option.value);
  };

  // Updated return statement
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        <label className="text-gray-700 font-bold" htmlFor={name}>{label}</label>
        <div className="relative">
          <button
            type="button"
            className="w-full flex items-center justify-between border border-gray-400 p-2 rounded-sm focus:border-2 focus:border-[#0047a3]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selected.label}
            <IoMdArrowDropdown
              className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 z-10 w-full bg-white border border-gray-200 rounded-md shadow-md"
              id={name}>
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleOptionClick(option)}
                  className={`px-3 py-1 hover:bg-[#eff2ff] hover:text-[#0047a3] cursor-pointer ${
                    selected.value === option.value ? "bg-[#eff2ff] font-semibold text-[#0047a3]" : ""
                  }`}
                >
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
