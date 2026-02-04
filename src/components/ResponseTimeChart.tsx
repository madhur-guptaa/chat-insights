import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ChartConfig } from '@/components/ui/chart';

interface ResponseTimeChartProps {
  data: { name: string; seconds: number }[];
}

// Helper to format seconds into a readable string
const formatSeconds = (s: number) => {
    if (s < 60) return `${Math.round(s)}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    return `${Math.round(s / 3600)}h`;
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  if (!data || data.length === 0) {
    return null;
  }
  
  // Dynamically create chart config
  const chartConfig = Object.fromEntries(
    data.map((item) => [
      item.name, { label: item.name, color: `hsl(var(--chart-${data.indexOf(item) + 1}))` },
    ])
  ) satisfies ChartConfig;

  const chartData = data.map(item => ({...item, fill: `var(--color-${item.name})`}));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Response Time</CardTitle>
        <CardDescription>Average time taken to reply to a message.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[200px]">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
            <XAxis type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="seconds" radius={4}>
                <LabelList 
                    dataKey="seconds" 
                    position="right" 
                    offset={8} 
                    className="fill-foreground" 
                    fontSize={12}
                    formatter={formatSeconds}
                />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
