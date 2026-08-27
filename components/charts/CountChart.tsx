"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface CountChartProps {
  data: { date: string; count: number }[];
  isLoading?: boolean;
  isError?: boolean;
}

const chartConfig = {
  count: {
    label: "생성된 공개 글",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function CountChart({ data, isLoading, isError }: CountChartProps) {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="count-chart-loading h-[400px] flex items-center justify-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div role="status" aria-live="polite" className="count-chart-error h-[400px] flex items-center justify-center text-muted-foreground">
        공개 글 생성 추이를 불러오지 못했습니다.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div role="status" aria-live="polite" className="count-chart-empty h-[400px] flex items-center justify-center text-muted-foreground">
        선택한 작성일 기간에 생성된 공개 글이 없습니다.
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(`${item.date}T00:00:00.000Z`).toLocaleDateString("ko-KR", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ChartContainer config={chartConfig} className="count-chart h-[400px] w-full">
      <AreaChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="countAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a8a8a8" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#686868" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelKey="displayDate" formatter={(value) => <span>{value}개</span>} />}
        />
        <Area type="monotone" dataKey="count" stroke="#888888" fill="url(#countAreaGradient)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  );
}
