import Select from "../../components/Select";
import type { Option } from "../../components/Select";

type Primitive = string | number;

export type { Option };

interface SelectFormProps<T extends Primitive = string> {
  label: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  directionRow?: boolean;
  children?: React.ReactNode;
  error?: boolean;

  // Opcionales para animación
  openDurationMs?: number;   // duración abrir/cerrar
  staggerMs?: number;        // separación entre opciones
  disabled?: boolean;
}

export default function SelectForm<T extends Primitive = string>({
  label,
  name,
  value,
  onChange,
  options,
  disabled,
  directionRow,
  children,
  error,
  openDurationMs = 200,
  staggerMs = 30,
}: SelectFormProps<T>) {

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div
        className={`flex min-w-0 ${
          directionRow ? "flex-row items-center text-nowrap" : "flex-col"
        } gap-2`}
      >
        <div className={`flex flex-row justify-between ${directionRow ? "w-auto shrink-0" : "w-full"}`}>
          <p className="text-gray-700 font-bold">
            {label}
          </p>
          {children}
        </div>

        <Select
          className="min-w-0 flex-1"
          name={name}
          value={value}
          onChange={onChange}
          options={options}
          error={error}
          openDurationMs={openDurationMs}
          staggerMs={staggerMs}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
