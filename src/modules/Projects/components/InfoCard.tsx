import StatCard from "./StatCard";
import { CgSpinner } from "react-icons/cg";

interface CountCardProps {
  loading?: boolean;
  title: string;
  info: number | string;
  children?: React.ReactNode;
}

export default function CountCard({ loading, title, info, children }: CountCardProps) {
  return (
    <StatCard
      title={title}
      right={
        <div className="flex justify-between items-center w-full">
          <p className="text-3xl font-extrabold">{ loading ? <CgSpinner className="animate-spin" /> : info}</p>
          { children }
        </div>
      }
    />
  );
}
