import { Pie, PieChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ChartConfig, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface ConversationStartersChartProps {
  data: { name: string; count: number }[];
}

export function ConversationStartersChart({ data }: ConversationStartersChartProps) {
    if (!data || data.length === 0) {
        return null;
    }

  // Dynamically create chart config from data
  const chartConfig = Object.fromEntries(
    data.map((item, index) => [
      item.name,
      {
        label: item.name,
        // Generate a color palette
        color: `hsl(var(--chart-${index + 1}))`,
      },
    ])
  ) satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who Texts First?</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
