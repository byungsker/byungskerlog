"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface CategoryChartProps {
  data: { tag: string; count: number }[];
  isLoading?: boolean;
  isError?: boolean;
}

const chartConfig = {
  count: {
    label: "공개 글 수",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function CategoryChart({ data, isLoading, isError }: CategoryChartProps) {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="category-chart-loading h-[400px] flex items-center justify-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div role="status" aria-live="polite" className="category-chart-error h-[400px] flex items-center justify-center text-muted-foreground">
        공개 글 인벤토리 분석을 불러오지 못했습니다.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div role="status" aria-live="polite" className="category-chart-empty h-[400px] flex items-center justify-center text-muted-foreground">
        선택한 작성일 기간에 태그가 있는 공개 글이 없습니다.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="category-chart h-[400px] w-full">
      <BarChart data={data} layout="vertical" margin={{ top: 20, right: 50, left: 80, bottom: 20 }}>
        <defs>
          <linearGradient id="categoryBarGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a8a8a8" />
            <stop offset="100%" stopColor="#686868" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="tag" width={80} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name, props) => (
                <span className="font-medium">
                  {props.payload?.tag}: {value}개 포스트
                </span>
              )}
            />
          }
        />
        <Bar dataKey="count" fill="url(#categoryBarGradient)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="count"
            position="right"
            formatter={(value: number) => `${value}개`}
            className="fill-foreground text-[11px] font-medium"
            offset={8}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
