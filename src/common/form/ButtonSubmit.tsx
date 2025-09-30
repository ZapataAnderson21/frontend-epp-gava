interface ButtonSubmitProps {
  label: string;
  loading: boolean;
  loadingLabel?: string;
}

export default function ButtonSubmit({ loading, label, loadingLabel }: ButtonSubmitProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="bg-[#0047a3] text-white px-4 py-2 rounded-md hover:bg-[#003366] cursor-pointer hover:scale-[101%] font-bold disabled:opacity-50"
    >
      {loading ? loadingLabel : label}
    </button>
  )
}
