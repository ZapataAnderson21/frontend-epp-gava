import Select from "../../components/Select";
import type { Option } from "../../components/Select";

type Primitive = string | number;

export type { Option };

interface SelectFormProps<T extends Primitive = string> {
  label: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  directionRow?: boolean;
  children?: React.ReactNode;
  error?: boolean;

  // Opcionales para animación
  openDurationMs?: number;   // duración abrir/cerrar
  staggerMs?: number;        // separación entre opciones
}

export default function SelectForm<T extends Primitive = string>({
  label,
  name,
  value,
  onChange,
  options,
  directionRow,
  children,
  error,
  openDurationMs = 200,
  staggerMs = 30,
}: SelectFormProps<T>) {

  return (
    <div className="flex flex-col w-full">
      <div
        className={`flex ${
          directionRow ? "flex-row items-center text-nowrap" : "flex-col"
        } gap-2`}
      >
        <div className="flex flex-row justify-between w-fit">
          <label className="text-gray-700 font-bold" htmlFor={name}>
            {label}
          </label>
          {children}
        </div>

        <Select
          name={name}
          value={value}
          onChange={onChange}
          options={options}
          error={error}
          openDurationMs={openDurationMs}
          staggerMs={staggerMs}
        />
      </div>
    </div>
  );
}
