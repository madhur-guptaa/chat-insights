import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';

interface ShiftTriggerCardProps {
    shifts: {
        positive: any[];
        negative: any[];
    };
}

const ShiftMessage = ({ msg, type }: { msg: any, type: 'positive' | 'negative' }) => (
    <div className="p-3 rounded-lg bg-secondary/50 text-sm">
        <div className="flex justify-between items-center mb-1">
            <span className={`font-semibold flex items-center gap-2 ${type === 'positive' ? 'text-positive' : 'text-destructive'}`}>
                {type === 'positive' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {msg.sender}
            </span>
            <span className="text-xs text-muted-foreground">
                {format(new Date(msg.timestamp), 'MMM d, HH:mm')}
            </span>
        </div>
        <p className="text-muted-foreground line-clamp-2">{msg.message}</p>
    </div>
);


export function ShiftTriggerCard({ shifts }: ShiftTriggerCardProps) {
    if (!shifts || (shifts.positive.length === 0 && shifts.negative.length === 0)) {
        return null;
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Shift Triggers</CardTitle>
        <CardDescription>The messages that caused the biggest shifts in the conversation's mood.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {shifts.positive.length > 0 && (
            <div>
                <h4 className="font-medium mb-2 text-positive">Positive Shifts</h4>
                <div className="space-y-2">
                    {shifts.positive.map((msg, i) => <ShiftMessage key={`pos-${i}`} msg={msg} type="positive" />)}
                </div>
            </div>
        )}
        {shifts.negative.length > 0 && (
            <div>
                <h4 className="font-medium mb-2 text-destructive">Negative Shifts</h4>
                <div className="space-y-2">
                    {shifts.negative.map((msg, i) => <ShiftMessage key={`neg-${i}`} msg={msg} type="negative" />)}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
