import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, ReferenceDot, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useMemo } from 'react';

interface EnrichedMessage {
    timestamp: Date;
    sentiment: { label: string; score: number; };
    rolling_avg_sentiment: number;
    is_negativity_cluster: boolean;
}

interface SentimentChartProps {
  data: EnrichedMessage[];
}

export function SentimentChart({ data }: SentimentChartProps) {
  const { chartData, negativityPoints } = useMemo(() => {
    const dailyData: { [key: string]: { positive: number; negative: number; neutral: number; count: number; totalScore: number } } = {};
    const negativityPoints: { timestamp: number; score: number }[] = [];

    data.forEach(msg => {
      const date = msg.timestamp.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { positive: 0, negative: 0, neutral: 0, count: 0, totalScore: 0 };
      }
      if (msg.sentiment.label === 'POSITIVE') dailyData[date].positive++;
      else if (msg.sentiment.label === 'NEGATIVE') dailyData[date].negative++;
      else dailyData[date].neutral++;
      
      dailyData[date].count++;
      dailyData[date].totalScore += msg.sentiment.label === 'POSITIVE' ? msg.sentiment.score : -msg.sentiment.score;

      if (msg.is_negativity_cluster) {
        negativityPoints.push({ timestamp: msg.timestamp.getTime(), score: msg.sentiment.score });
      }
    });

    const chartData = Object.keys(dailyData).map(date => ({
      date,
      ...dailyData[date],
      avgScore: dailyData[date].totalScore / dailyData[date].count,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return { chartData, negativityPoints };
  }, [data]);

  const rollingAvgData = useMemo(() => {
      // Downsample for performance if too many points
      const step = Math.max(1, Math.floor(data.length / 300));
      return data.filter((_, i) => i % step === 0).map(msg => ({
          timestamp: msg.timestamp.getTime(),
          rolling_avg: msg.rolling_avg_sentiment
      }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Timeline</CardTitle>
        <CardDescription>Daily sentiment bars with a smoothed rolling average of the conversation's mood. Red dots indicate potential communication breakdowns.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="w-full h-[300px]">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[-1, 1]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              
              <Bar yAxisId="left" dataKey="positive" stackId="a" fill="hsl(var(--chart-2))" />
              <Bar yAxisId="left" dataKey="negative" stackId="a" fill="hsl(var(--chart-1))" />

              <Line
                yAxisId="right"
                type="monotone"
                data={rollingAvgData}
                dataKey="rolling_avg"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              
              {negativityPoints.map((p, i) => (
                <ReferenceDot
                  key={i}
                  yAxisId="right"
                  x={new Date(p.timestamp).toISOString().split('T')[0]}
                  y={p.score}
                  r={5}
                  fill="hsl(var(--destructive))"
                  stroke="none"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}