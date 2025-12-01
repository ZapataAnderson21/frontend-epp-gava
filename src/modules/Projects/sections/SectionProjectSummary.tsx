import type { ReactNode } from "react";
import { FaArrowRightArrowLeft, FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";

interface PropsSectionProjectSummary {
  children?: React.ReactNode;
  title: string;
  trend: ReactNode
}

export default function SectionProjectSummary({ title, children, trend }: PropsSectionProjectSummary) {

  const TrendIcon =
      trend === "up" ? (
        <FaArrowTrendUp className="text-2xl text-green-600" />
      ) : trend === "down" ? (
        <FaArrowTrendDown className="text-2xl text-red-600" />
      ) : (
        <FaArrowRightArrowLeft className="text-2xl text-primary" />
      );

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex flex-row gap-2 items-center">
        <h1 className="text-lg font-extrabold">{title}</h1>
        {TrendIcon}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
