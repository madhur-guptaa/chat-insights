import { useState, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { StatCard } from '@/components/StatCard';
import { SentimentChart } from '@/components/SentimentChart';
import { ParticipantChart } from '@/components/ParticipantChart';
import { HighlightCard } from '@/components/HighlightCard';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { MoodScore } from '@/components/MoodScore';
import { parseWhatsAppChat, ParsedChat } from '@/lib/whatsappParser';
import {
  initializeSentimentModel,
  analyzeMessages,
  aggregateSentimentByDay,
  getHighlightMoments,
  calculateOverallStats,
  MessageWithSentiment,
  SentimentTimeline,
  AnalysisProgress as AnalysisProgressType,
} from '@/lib/sentimentAnalyzer';
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  Smile, 
  Frown,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

type AnalysisState = 'idle' | 'parsing' | 'loading-model' | 'analyzing' | 'complete';

export default function Index() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [parsedChat, setParsedChat] = useState<ParsedChat | null>(null);
  const [analyzedMessages, setAnalyzedMessages] = useState<MessageWithSentiment[]>([]);
  const [timeline, setTimeline] = useState<SentimentTimeline[]>([]);
  const [progress, setProgress] = useState<AnalysisProgressType>({ 
    current: 0, 
    total: 100, 
    status: '' 
  });
  const [stats, setStats] = useState<ReturnType<typeof calculateOverallStats> | null>(null);
  const [highlights, setHighlights] = useState<{ positive: MessageWithSentiment[], negative: MessageWithSentiment[] }>({ positive: [], negative: [] });

  const handleFileUpload = useCallback(async (content: string) => {
    try {
      // Parse the chat
      setState('parsing');
      setProgress({ current: 0, total: 100, status: 'Parsing chat file...' });
      
      const parsed = parseWhatsAppChat(content);
      setParsedChat(parsed);
      
      if (parsed.messages.length === 0) {
        alert('Could not parse any messages. Please make sure this is a valid WhatsApp export file.');
        setState('idle');
        return;
      }
      
      // Load the sentiment model
      setState('loading-model');
      const modelLoaded = await initializeSentimentModel((p) => setProgress(p));
      
      if (!modelLoaded) {
        alert('Failed to load the AI model. Please try again.');
        setState('idle');
        return;
      }
      
      // Analyze messages
      setState('analyzing');
      const analyzed = await analyzeMessages(parsed.messages, (p) => setProgress(p));
      setAnalyzedMessages(analyzed);
      
      // Calculate results
      const sentimentTimeline = aggregateSentimentByDay(analyzed);
      setTimeline(sentimentTimeline);
      
      const overallStats = calculateOverallStats(analyzed);
      setStats(overallStats);
      
      const moments = getHighlightMoments(analyzed);
      setHighlights(moments);
      
      setState('complete');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('An error occurred during analysis. Please try again.');
      setState('idle');
    }
  }, []);

  const handleReset = () => {
    setState('idle');
    setParsedChat(null);
    setAnalyzedMessages([]);
    setTimeline([]);
    setStats(null);
    setHighlights({ positive: [], negative: [] });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-hero)' }}>
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">ChatMood</h1>
              <p className="text-xs text-muted-foreground">WhatsApp Analyzer</p>
            </div>
          </div>
          
          {state === 'complete' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              New Analysis
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Upload State */}
        {state === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
            <div className="text-center space-y-4 slide-up">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Understand Your{' '}
                <span className="gradient-text">Conversations</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Upload your WhatsApp chat export and discover the emotional journey 
                of your conversations with AI-powered sentiment analysis.
              </p>
            </div>
            
            <FileUpload onFileUpload={handleFileUpload} isLoading={false} />
          </div>
        )}

        {/* Loading/Processing State */}
        {(state === 'parsing' || state === 'loading-model' || state === 'analyzing') && (
          <div className="flex items-center justify-center min-h-[70vh]">
            <AnalysisProgress 
              progress={progress} 
              isComplete={false}
            />
          </div>
        )}

        {/* Results State */}
        {state === 'complete' && parsedChat && stats && (
          <div className="space-y-8">
            {/* Overview Stats */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Messages"
                  value={parsedChat.totalMessages.toLocaleString()}
                  subtitle={`${analyzedMessages.length} analyzed`}
                  icon={MessageSquare}
                  delay={0}
                />
                <StatCard
                  title="Participants"
                  value={parsedChat.participants.length}
                  subtitle={parsedChat.participants.slice(0, 2).join(', ')}
                  icon={Users}
                  variant="accent"
                  delay={100}
                />
                <StatCard
                  title="Chat Duration"
                  value={`${Math.ceil((parsedChat.endDate.getTime() - parsedChat.startDate.getTime()) / (1000 * 60 * 60 * 24))} days`}
                  subtitle={`${format(parsedChat.startDate, 'MMM d, yyyy')} - ${format(parsedChat.endDate, 'MMM d, yyyy')}`}
                  icon={Calendar}
                  delay={200}
                />
                <StatCard
                  title="Positive Messages"
                  value={`${Math.round(stats.positivePercent)}%`}
                  subtitle={`${stats.positive} messages`}
                  icon={Smile}
                  variant="positive"
                  delay={300}
                />
              </div>
            </section>

            {/* Mood Score & Sentiment Split */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MoodScore score={stats.avgPositivity} />
              
              <div className="lg:col-span-2 glass-card rounded-2xl p-6 fade-in">
                <h3 className="text-xl font-semibold text-foreground mb-4">Sentiment Distribution</h3>
                <div className="space-y-4">
                  {/* Positive */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Smile className="w-4 h-4 text-positive" />
                        Positive
                      </span>
                      <span className="text-muted-foreground">{stats.positive} ({Math.round(stats.positivePercent)}%)</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-positive to-positive/70"
                        style={{ width: `${stats.positivePercent}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Negative */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Frown className="w-4 h-4 text-negative" />
                        Negative
                      </span>
                      <span className="text-muted-foreground">{stats.negative} ({Math.round(stats.negativePercent)}%)</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-negative to-negative/70"
                        style={{ width: `${stats.negativePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Sentiment Timeline */}
            {timeline.length > 0 && (
              <section>
                <SentimentChart data={timeline} />
              </section>
            )}

            {/* Participant Distribution */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ParticipantChart data={parsedChat.messagesByParticipant} />
              
              {/* Quick Stats */}
              <div className="glass-card rounded-2xl p-6 fade-in">
                <h3 className="text-xl font-semibold text-foreground mb-4">Chat Stats</h3>
                <div className="space-y-4">
                  {Object.entries(parsedChat.messagesByParticipant)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                        <span className="font-medium text-foreground">{name}</span>
                        <span className="text-muted-foreground">
                          {count.toLocaleString()} messages ({Math.round((count / parsedChat.totalMessages) * 100)}%)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* Highlight Moments */}
            {(highlights.positive.length > 0 || highlights.negative.length > 0) && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {highlights.positive.length > 0 && (
                  <HighlightCard messages={highlights.positive} type="positive" />
                )}
                {highlights.negative.length > 0 && (
                  <HighlightCard messages={highlights.negative} type="negative" />
                )}
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>All analysis runs locally in your browser. Your chats never leave your device.</p>
        </div>
      </footer>
    </div>
  );
}
