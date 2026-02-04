import {useCallback, useState} from 'react';
import {FileUpload} from '@/components/FileUpload';
import {StatCard} from '@/components/StatCard';
import {SentimentChart} from '@/components/SentimentChart';
import {ParticipantChart} from '@/components/ParticipantChart';
import {HighlightCard} from '@/components/HighlightCard';
import {AnalysisProgress} from '@/components/AnalysisProgress';
import {MoodScore} from '@/components/MoodScore';
import {ActivityChart} from '@/components/ActivityChart';
import {EmojiChart} from '@/components/EmojiChart';
import {ConversationStartersChart} from '@/components/ConversationStartersChart';
import {WordCloudChart} from '@/components/WordCloudChart';
import {ResponseTimeChart} from '@/components/ResponseTimeChart';
import {ShiftTriggerCard} from '@/components/ShiftTriggerCard';
import {ArrowLeft, Calendar, Frown, MessageSquare, Smile, Sparkles, Users} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {format} from 'date-fns';

// --- Type Definitions ---
type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';

interface ParsedChat {
    participants: string[];
    startDate: Date;
    endDate: Date;
    totalMessages: number;
    messagesByParticipant: Record<string, number>;
}

interface EnrichedMessage {
    timestamp: Date;
    sender: string;
    message: string;
    sentiment_polarity: number;
    sentiment: { label: string; score: number; }; // Add this line
}

interface ActivityData {
    by_hour: { hour: number; messages: number }[];
    by_day: { day: string; messages: number }[];
}

interface EmojiData {
    emoji: string;
    count: number;
}

interface StarterData {
    name: string;
    count: number;
}

interface WordCloudData {
    text: string;
    value: number;
}

interface ResponseTimeData {
    name: string;
    seconds: number;
}

interface SentimentShiftData {
    positive: any[];
    negative: any[];
}

interface OverallStats {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    positivePercent: number;
    negativePercent: number;
    neutralPercent: number;
    avgPositivity: number;
}

interface Highlights {
    positive: EnrichedMessage[];
    negative: EnrichedMessage[];
}

// --- Main Component ---
export default function Index() {
    const [state, setState] = useState<AnalysisState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [parsedChat, setParsedChat] = useState<ParsedChat | null>(null);
    const [analyzedMessages, setAnalyzedMessages] = useState<EnrichedMessage[]>([]);
    const [stats, setStats] = useState<OverallStats | null>(null);
    const [highlights, setHighlights] = useState<Highlights | null>(null);
    const [activityData, setActivityData] = useState<ActivityData | null>(null);
    const [emojiData, setEmojiData] = useState<EmojiData[]>([]);
    const [starterData, setStarterData] = useState<StarterData[]>([]);
    const [wordCloudData, setWordCloudData] = useState<WordCloudData[]>([]);
    const [responseTimes, setResponseTimes] = useState<ResponseTimeData[]>([]);
    const [sentimentShifts, setSentimentShifts] = useState<SentimentShiftData | null>(null);

    const handleFileUpload = useCallback(async (file: File) => {
        setState('analyzing');
        setError(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/api/analyze', {method: 'POST', body: formData});
            if (!response.ok) {
                const errData = await response.json();
                console.error('API Error Response:', errData); // Keep this error log for now
                throw new Error(errData.detail || 'Analysis failed.');
            }
            const result = await response.json();
            // console.log('API Result:', result); // Remove this log            if (!result.messages || result.messages.length === 0) throw new Error("Analysis returned no messages.");
            const messagesWithDates: EnrichedMessage[] = result.messages.map((msg: any) => {
                let sentimentLabel: string;
                if (msg.sentiment_polarity > 0.1) {
                    sentimentLabel = 'POSITIVE';
                } else if (msg.sentiment_polarity < -0.1) {
                    sentimentLabel = 'NEGATIVE';
                } else {
                    sentimentLabel = 'NEUTRAL';
                }
                return {
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                    sentiment: {
                        label: sentimentLabel,
                        score: msg.sentiment_polarity,
                    },
                };
            });
            setAnalyzedMessages(messagesWithDates);
            setParsedChat({
                participants: result.metadata.participants,
                startDate: new Date(result.metadata.start_date),
                endDate: new Date(result.metadata.end_date),
                totalMessages: result.metadata.total_messages,
                messagesByParticipant: result.metadata.messages_by_participant,
            });
            const metrics = result.additional_metrics;
            setActivityData(metrics.activity);
            setEmojiData(metrics.emojis);
            setStarterData(metrics.starters);
            setWordCloudData(metrics.word_cloud);
            setResponseTimes(metrics.avg_response_times);
            setSentimentShifts(metrics.sentiment_shifts);
            const total = messagesWithDates.length;
            const positive = messagesWithDates.filter(m => m.sentiment_polarity > 0.1).length;
            const negative = messagesWithDates.filter(m => m.sentiment_polarity < -0.1).length;
            const neutral = total - positive - negative;
            const avgPositivity = messagesWithDates.reduce((acc, m) => acc + m.sentiment_polarity, 0) / total;
            setStats({
                total,
                positive,
                negative,
                neutral,
                positivePercent: total > 0 ? (positive / total) * 100 : 0,
                negativePercent: total > 0 ? (negative / total) * 100 : 0,
                neutralPercent: total > 0 ? (neutral / total) * 100 : 0,
                avgPositivity: total > 0 ? (avgPositivity + 1) / 2 * 100 : 50
            });
            const sorted = [...messagesWithDates].sort((a, b) => b.sentiment_polarity - a.sentiment_polarity);
            setHighlights({
                positive: sorted.filter(m => m.sentiment_polarity > 0.1).slice(0, 5),
                negative: sorted.filter(m => m.sentiment_polarity < -0.1).reverse().slice(0, 5)
            });
            setState('complete');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setState('error');
        }
    }, []);

    const handleReset = () => {
        setState('idle');
        setError(null);
        setParsedChat(null);
        setAnalyzedMessages([]);
        setStats(null);
        setHighlights(null);
        setActivityData(null);
        setEmojiData([]);
        setStarterData([]);
        setWordCloudData([]);
        setResponseTimes([]);
        setSentimentShifts(null);
    };

    return (
        <div className="min-h-screen" style={{background: 'var(--gradient-hero)'}}>
            <header className="border-b border-border/50 backdrop-blur-xl bg-background/30 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground"/></div>
                        <div><h1 className="text-xl font-bold gradient-text">Chat Insights</h1><p
                            className="text-xs text-muted-foreground">Advanced Analyzer</p></div>
                    </div>
                    {(state === 'complete' || state === 'error') && (
                        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2"><ArrowLeft
                            className="w-4 h-4"/> New Analysis</Button>)}
                </div>
            </header>
            <main className="container mx-auto px-4 py-12">
                {state === 'idle' && (<div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
                    <div className="text-center space-y-4 slide-up"><h2
                        className="text-4xl md:text-5xl font-bold text-foreground">Uncover the Patterns in Your <span
                        className="gradient-text">Conversations</span></h2><p
                        className="text-lg text-muted-foreground max-w-xl mx-auto">Get a deep, contextual analysis of
                        your WhatsApp chats, from sentiment trends to communication breakdowns.</p></div>
                    <FileUpload onFileUpload={handleFileUpload} isLoading={state === 'analyzing'}/></div>)}
                {state === 'analyzing' && (
                    <div className="flex items-center justify-center min-h-[70vh]"><AnalysisProgress
                        progress={{current: 0, total: 100, status: 'Running deep analysis...'}} isComplete={false}
                        isIndeterminate={true}/></div>)}
                {state === 'error' && (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                            <Frown className="w-8 h-8 text-destructive"/></div>
                        <h2 className="text-2xl font-bold">Analysis Failed</h2><p
                        className="text-destructive max-w-md">{error}</p></div>)}
                {state === 'complete' && parsedChat && stats && (
                    <div className="space-y-8">
                        <section><h2 className="text-2xl font-bold text-foreground mb-6">Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><StatCard
                                title="Total Messages" value={parsedChat.totalMessages.toLocaleString()}
                                icon={MessageSquare}/><StatCard title="Participants"
                                                                value={parsedChat.participants.length}
                                                                subtitle={parsedChat.participants.slice(0, 2).join(', ')}
                                                                icon={Users}/><StatCard title="Chat Duration"
                                                                                        value={`${Math.ceil((parsedChat.endDate.getTime() - parsedChat.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`}
                                                                                        subtitle={`${format(parsedChat.startDate, 'MMM d, yyyy')} - ${format(parsedChat.endDate, 'MMM d, yyyy')}`}
                                                                                        icon={Calendar}/><StatCard
                                title="Positive Messages" value={`${Math.round(stats.positivePercent)}%`}
                                subtitle={`${stats.positive} messages`} icon={Smile} variant="positive"/></div>
                        </section>
                        {analyzedMessages.length > 0 && <SentimentChart data={analyzedMessages}/>}
                        <section><h2 className="text-2xl font-bold text-foreground mb-6">Advanced Analysis</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2"><WordCloudChart data={wordCloudData}/></div>
                                <div className="space-y-6">{responseTimes.length > 0 &&
                                    <ResponseTimeChart data={responseTimes}/>}{sentimentShifts &&
                                    <ShiftTriggerCard shifts={sentimentShifts}/>}</div>
                            </div>
                        </section>
                        <section><h2 className="text-2xl font-bold text-foreground mb-6">Engagement Patterns</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{activityData &&
                                <ActivityChart data={activityData}/>}
                                <div className="flex flex-col space-y-6">{starterData &&
                                    <ConversationStartersChart data={starterData}/>}{emojiData &&
                                    <EmojiChart data={emojiData}/>}</div>
                            </div>
                        </section>
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6"><MoodScore
                            score={stats.avgPositivity}/>
                            <div className="lg:col-span-2 glass-card rounded-2xl p-6 fade-in"><h3
                                className="text-xl font-semibold text-foreground mb-4">Sentiment Distribution</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span
                                            className="flex items-center gap-2"><Smile
                                            className="w-4 h-4 text-positive"/>Positive</span><span
                                            className="text-muted-foreground">{stats.positive} msgs ({Math.round(stats.positivePercent)}%)</span>
                                        </div>
                                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-positive to-positive/70"
                                                 style={{width: `${stats.positivePercent}%`}}/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span
                                            className="flex items-center gap-2"><Frown
                                            className="w-4 h-4 text-negative"/>Negative</span><span
                                            className="text-muted-foreground">{stats.negative} msgs ({Math.round(stats.negativePercent)}%)</span>
                                        </div>
                                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-negative to-negative/70"
                                                 style={{width: `${stats.negativePercent}%`}}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ParticipantChart
                            data={parsedChat.messagesByParticipant}/>
                            <div className="glass-card rounded-2xl p-6 fade-in"><h3
                                className="text-xl font-semibold text-foreground mb-4">Messages by Participant</h3>
                                <div
                                    className="space-y-4">{Object.entries(parsedChat.messagesByParticipant).sort(([, a], [, b]) => b - a).map(([name, count]) => (
                                    <div key={name}
                                         className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                                        <span className="font-medium text-foreground">{name}</span><span
                                        className="text-muted-foreground">{count.toLocaleString()} messages ({Math.round((count / parsedChat.totalMessages) * 100)}%)</span>
                                    </div>))}</div>
                            </div>
                        </section>
                        {highlights && (highlights.positive.length > 0 || highlights.negative.length > 0) && (<section
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6">{highlights.positive.length > 0 && (
                            <HighlightCard messages={highlights.positive}
                                           type="positive"/>)}{highlights.negative.length > 0 && (
                            <HighlightCard messages={highlights.negative} type="negative"/>)}</section>)}
                    </div>
                )}
            </main>
            <footer className="border-t border-border/50 mt-12">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground"><p>Analysis by
                    Python & TextBlob.</p></div>
            </footer>
        </div>
    );
}
