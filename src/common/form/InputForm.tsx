
interface InputFormProps {
  label: string;
  name: string;
  type: string;
  value: string | number;
  maxLength?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  optional?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function InputForm({ label, name, type, value, maxLength, onChange, error, optional, disabled, children }: InputFormProps) {
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row justify-between">
          <label htmlFor={name} className="font-semibold text-nowrap">
            {label} {optional && <span className="text-[10px] font-bold">(opcional)</span>}
          </label>
          {children}
        </div>
        <input
          id={name}
          name={name}
          type={type}
          className={`border ${error ? "border-red-600" : "border-gray-400"} p-2 rounded-sm w-full focus:outline-[#0047a3]`}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          required={!optional}
          disabled={disabled}
        />
      </div>
      {error && <p className="text-red-600 text-2xs">{error}</p>}
    </div>
  )
}
