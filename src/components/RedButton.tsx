import { Link } from "react-router-dom";

interface RedButtonProps {
  href: string;
  name: string;
}

export default function RedButton({ href, name }: RedButtonProps) {
  return (
    <Link 
      to={href} 
      className="inline-block w-full bg-[#d80027] px-4 py-2 rounded-md shadow-sm hover:bg-[#c80008] transition-colors cursor-pointer text-md text-white font-bold text-center"
    >
      {name}
    </Link>
  );
}