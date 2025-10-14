import StatCard from "./StatCard";
import { CgSpinner } from "react-icons/cg";
import SeeButton from "../../../common/SeeButton";

interface CountCardProps {
  loading?: boolean;
  title: string;
  count: number;
  to: string;
}

export default function CountCard({ loading, title, count, to }: CountCardProps) {
  return (
    <StatCard
      title={title}
      right={
        <>
          <p className="text-4xl font-extrabold">{ loading ? <CgSpinner className="animate-spin" /> : count}</p>
          <SeeButton  to={to} />
        </>
      }
    />
  );
}
