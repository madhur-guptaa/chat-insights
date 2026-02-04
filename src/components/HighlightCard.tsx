import {MessageWithSentiment} from '@/lib/sentimentAnalyzer';
import {format} from 'date-fns';
import {Heart, Quote, ThumbsDown} from 'lucide-react';

interface HighlightCardProps {
    messages: MessageWithSentiment[];
    type: 'positive' | 'negative';
}

export function HighlightCard({messages, type}: HighlightCardProps) {
    const isPositive = type === 'positive';

    return (
        <div className="chart-container fade-in">
            <div className="mb-6 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPositive ? 'bg-positive/20' : 'bg-negative/20'
                }`}>
                    {isPositive ? (
                        <Heart className="w-5 h-5 text-positive"/>
                    ) : (
                        <ThumbsDown className="w-5 h-5 text-negative"/>
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-foreground">
                        {isPositive ? 'Happiest Moments' : 'Low Points'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {isPositive ? 'Messages with the most positive sentiment' : 'Messages with the most negative sentiment'}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {messages.slice(0, 5).map((msg, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-xl border ${
                            isPositive
                                ? 'bg-positive/5 border-positive/20'
                                : 'bg-negative/5 border-negative/20'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <Quote className={`w-4 h-4 mt-1 flex-shrink-0 ${
                                isPositive ? 'text-positive/60' : 'text-negative/60'
                            }`}/>
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm leading-relaxed">
                                    {msg.message.length > 200
                                        ? msg.message.slice(0, 200) + '...'
                                        : msg.message}
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-medium">{msg.sender}</span>
                                    <span>•</span>
                                    <span>{format(msg.timestamp, 'MMM d, yyyy')}</span>
                                    <span>•</span>
                                    <span className={isPositive ? 'text-positive' : 'text-negative'}>
                    {Math.round(msg.sentiment.score * 100)}% confidence
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
