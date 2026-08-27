"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface ReadingChartProps {
  data: {
    title: string;
    slug: string;
    sessions: number;
    avgDepth: number;
    completionRate: number;
  }[];
  isLoading?: boolean;
  isError?: boolean;
}

const chartConfig = {
  completionRate: {
    label: "세션 완료율",
    color: "hsl(var(--chart-1))",
  },
  avgDepth: {
    label: "평균 스크롤",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

function truncateTitle(title: string, maxLen = 8): string {
  const withoutPrefix = title.replace(/^\[[\w-]+\]\s*/i, "");
  if (withoutPrefix.length <= maxLen) return withoutPrefix;
  return withoutPrefix.slice(0, maxLen) + "...";
}

export function ReadingChart({ data, isLoading, isError }: ReadingChartProps) {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="reading-chart-loading h-[400px] flex items-center justify-center text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div role="status" aria-live="polite" className="reading-chart-error h-[400px] flex items-center justify-center text-muted-foreground">
        세션 레코드 분석을 불러오지 못했습니다.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div role="status" aria-live="polite" className="reading-chart-empty h-[400px] flex items-center justify-center text-muted-foreground">
        선택한 기간에 기록된 세션 레코드가 없습니다. 사람 수나 기간별 읽기 시간은 측정하지 않습니다.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    displayTitle: truncateTitle(item.title),
  }));

  return (
    <ChartContainer config={chartConfig} className="reading-chart h-[400px] w-full">
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 60, left: 80, bottom: 20 }}>
        <defs>
          <linearGradient id="completionRateGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b8b8b8" />
            <stop offset="100%" stopColor="#787878" />
          </linearGradient>
          <linearGradient id="avgDepthGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#909090" />
            <stop offset="100%" stopColor="#505050" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="displayTitle"
          width={80}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.displayTitle === label);
                return item ? `${item.title} (${item.sessions}개 세션 레코드)` : label;
              }}
              formatter={(value) => <span>{value}%</span>}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="completionRate" fill="url(#completionRateGradient)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="completionRate"
            position="right"
            formatter={(value: number) => `${value}%`}
            className="fill-foreground text-[11px] font-medium"
            offset={8}
          />
        </Bar>
        <Bar dataKey="avgDepth" fill="url(#avgDepthGradient)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="avgDepth"
            position="right"
            formatter={(value: number) => `${value}%`}
            className="fill-foreground text-[11px] font-medium"
            offset={8}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
