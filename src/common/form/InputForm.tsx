
interface InputFormProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  optional?: boolean;
}

export default function InputForm({ label, name, type, value, onChange, error, optional }: InputFormProps) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        <p className="text-gray-700 font-bold">{label}</p>
        <input
          id={name}
          name={name}
          type={type}
          className="border border-gray-400 p-2 rounded-sm w-full focus:outline-[#0047a3]"
          value={value}
          onChange={onChange}
          required={!optional}
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}
