import { Link } from "react-router-dom";

interface RedButtonProps {
  href: string;
  name: string;
}

export default function RedButton({ href, name }: RedButtonProps) {
  return (
    <Link 
      to={href} 
      className="inline-block bg-[#d80027] px-3 py-2 rounded-md shadow-sm hover:bg-[#c80008] transition-colors cursor-pointer hover:scale-[101%] text-md text-white font-bold text-center"
    >
      {name}
    </Link>
  );
}