import StatCard from "./StatCard";
import { CgSpinner } from "react-icons/cg";

interface CountCardProps {
  loading?: boolean;
  title: string;
  count: number;
}

export default function CountCard({ loading, title, count }: CountCardProps) {
  return (
    <StatCard
      title={title}
      right={
        <>
          <p className="text-2xl font-extrabold">{ loading ? <CgSpinner className="animate-spin" /> : count}</p>
        </>
      }
    />
  );
}
