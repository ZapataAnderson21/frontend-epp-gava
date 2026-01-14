interface InfoFieldProps {
  label: string;
  value?: string | number | null;
}

export default function InfoField({ label, value }: InfoFieldProps) {
  return (
    <p className="text-nowrap">
      <span className="font-bold">{label}: </span>
      {value ?? "—"}
    </p>
  );
}
