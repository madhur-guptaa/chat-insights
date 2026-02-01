import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SentimentTimeline } from '@/lib/sentimentAnalyzer';
import { format, parseISO } from 'date-fns';

interface SentimentChartProps {
  data: SentimentTimeline[];
}

export function SentimentChart({ data }: SentimentChartProps) {
  // Aggregate by week if too many data points
  const chartData = data.length > 60 ? aggregateByWeek(data) : data;
  
  return (
    <div className="chart-container fade-in">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">Sentiment Over Time</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Track the emotional flow of your conversations
        </p>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(166 76% 48%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(166 76% 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(12 76% 61%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(12 76% 61%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            
            <XAxis 
              dataKey="date" 
              stroke="hsl(215 20% 55%)"
              fontSize={12}
              tickFormatter={(value) => {
                try {
                  return format(parseISO(value), 'MMM d');
                } catch {
                  return value;
                }
              }}
            />
            
            <YAxis 
              stroke="hsl(215 20% 55%)"
              fontSize={12}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '12px',
                padding: '12px',
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)' }}
              labelFormatter={(value) => {
                try {
                  return format(parseISO(value), 'MMMM d, yyyy');
                } catch {
                  return value;
                }
              }}
            />
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            
            <Area
              type="monotone"
              dataKey="positive"
              name="Positive"
              stroke="hsl(166 76% 48%)"
              fill="url(#positiveGradient)"
              strokeWidth={2}
            />
            
            <Area
              type="monotone"
              dataKey="negative"
              name="Negative"
              stroke="hsl(12 76% 61%)"
              fill="url(#negativeGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function aggregateByWeek(data: SentimentTimeline[]): SentimentTimeline[] {
  const weeks: Record<string, SentimentTimeline[]> = {};
  
  data.forEach(d => {
    const date = parseISO(d.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(d);
  });
  
  return Object.entries(weeks).map(([date, items]) => ({
    date,
    positive: items.reduce((sum, i) => sum + i.positive, 0),
    negative: items.reduce((sum, i) => sum + i.negative, 0),
    neutral: items.reduce((sum, i) => sum + i.neutral, 0),
    avgScore: items.reduce((sum, i) => sum + i.avgScore, 0) / items.length,
    messageCount: items.reduce((sum, i) => sum + i.messageCount, 0),
  }));
}
