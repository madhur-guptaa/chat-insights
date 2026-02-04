import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ChartConfig } from '@/components/ui/chart';

interface EmojiChartProps {
  data: { emoji: string; count: number }[];
}

const chartConfig = {
  count: {
    label: 'Count',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

export function EmojiChart({ data }: EmojiChartProps) {
  if (!data || data.length === 0) {
    return null; // Don't render the card if there's no emoji data
  }

  // Reverse the data so the most frequent emoji is at the top
  const reversedData = [...data].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Emojis</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <BarChart
            data={reversedData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="emoji"
              type="category"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 20, fill: 'hsl(var(--foreground))' }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                <LabelList dataKey="count" position="right" offset={8} className="fill-foreground" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
