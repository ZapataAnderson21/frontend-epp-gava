interface TextAreaFormProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  optional?: boolean;
}


export default function TextAreaForm({ label, name, value, onChange, optional }: TextAreaFormProps) {
  return (
    <div className="flex flex-col w-full gap-2">
      <label htmlFor={name} className="font-semibold">
        {label} {optional && <span className="text-[10px] font-bold">(opcional)</span>}
      </label>
      <textarea
        id={name}
        name={name}
        className="border border-gray-400 p-3 rounded-sm focus:outline-[#0047a3]"
        value={value}
        onChange={onChange}
        required={!optional}
      />
    </div>
  )
}
