interface SelectCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

export default function SelectCard({ icon, title, onClick}: SelectCardProps) {

  return (
    <div className="border py-8 px-12 rounded-md shadow-md flex flex-col items-center 
                  bg-[#f5f7ff] justify-center gap-2 cursor-pointer hover:shadow-lg hover:scale-105 
                  transition-shadow duration-200 hover:text-[#0047a3]" onClick={onClick}>
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  );
}
