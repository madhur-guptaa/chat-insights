import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface ParticipantChartProps {
  data: Record<string, number>;
}

const COLORS = [
  'hsl(166 76% 48%)',
  'hsl(280 70% 60%)',
  'hsl(12 76% 61%)',
  'hsl(200 80% 55%)',
  'hsl(45 93% 58%)',
  'hsl(320 70% 55%)',
];

export function ParticipantChart({ data }: ParticipantChartProps) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="chart-container fade-in">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground">Messages by Participant</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Who talks the most?
        </p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="hsl(222 47% 6%)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '12px',
                padding: '12px',
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)' }}
              formatter={(value: number) => [`${value.toLocaleString()} messages`, '']}
            />
            
            <Legend 
              formatter={(value) => (
                <span style={{ color: 'hsl(210 40% 98%)' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
