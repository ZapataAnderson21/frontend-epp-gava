interface BlueButtonProps {
  href: string;
  name: string;
  onClick?: () => void;
}

export default function BlueButton({ href, name, onClick }: BlueButtonProps) {
  return (
    <a className="w-full" href={href}>
      <button type="button" onClick={onClick}
              className="w-full bg-[#0047a3] px-4 py-2 rounded-md shadow-sm transition-colors 
                         hover:bg-[#003a80] cursor-pointer text-white font-semibold mt-1"
      >
        {name}
      </button>
    </a>
  );
}