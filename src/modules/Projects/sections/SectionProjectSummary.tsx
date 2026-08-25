import type { ReactNode } from "react";
import { ArrowRightLeft as FaArrowRightArrowLeft, TrendingDown as FaArrowTrendDown, TrendingUp as FaArrowTrendUp } from "lucide-react";

interface PropsSectionProjectSummary {
  children?: ReactNode;
  title: string;
  trend: "up" | "down" | "equal";
  summary?: ReactNode;
}

export default function SectionProjectSummary({ title, children, trend, summary }: PropsSectionProjectSummary) {

  const TrendIcon =
      trend === "up" ? (
        <FaArrowTrendUp className="text-xl text-green-600" />
      ) : trend === "down" ? (
        <FaArrowTrendDown className="text-xl text-red-600" />
      ) : (
        <FaArrowRightArrowLeft className="text-xl text-primary" />
      );

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex flex-row gap-2 items-center">
          <h1 className="text-base font-extrabold">{title}</h1>
          {TrendIcon}
        </div>
        {summary ? <div className="font-extrabold text-red-600">{summary}</div> : null}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
