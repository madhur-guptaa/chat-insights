import { pipeline, type PipelineType } from '@huggingface/transformers';
import { ChatMessage } from './whatsappParser';

export interface SentimentResult {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
}

export interface MessageWithSentiment extends ChatMessage {
  sentiment: SentimentResult;
}

export interface SentimentTimeline {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  avgScore: number;
  messageCount: number;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  status: string;
}

let sentimentPipeline: any = null;
let isLoading = false;

export async function initializeSentimentModel(
  onProgress?: (progress: AnalysisProgress) => void
): Promise<boolean> {
  if (sentimentPipeline) return true;
  if (isLoading) return false;
  
  isLoading = true;
  
  try {
    onProgress?.({ current: 0, total: 100, status: 'Loading sentiment model...' });
    
    // Using a small, fast sentiment model
    sentimentPipeline = await pipeline(
      'sentiment-analysis' as PipelineType,
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      { 
        progress_callback: (data: any) => {
          if (data.progress) {
            onProgress?.({ 
              current: Math.round(data.progress), 
              total: 100, 
              status: 'Downloading model...' 
            });
          }
        }
      }
    );
    
    onProgress?.({ current: 100, total: 100, status: 'Model ready!' });
    isLoading = false;
    return true;
  } catch (error) {
    console.error('Failed to load sentiment model:', error);
    isLoading = false;
    return false;
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  if (!sentimentPipeline) {
    throw new Error('Sentiment model not initialized');
  }
  
  try {
    // Truncate long messages
    const truncatedText = text.slice(0, 512);
    const result = await sentimentPipeline(truncatedText);
    
    if (result && result[0]) {
      return {
        label: result[0].label as 'POSITIVE' | 'NEGATIVE',
        score: result[0].score,
      };
    }
    
    return { label: 'NEUTRAL', score: 0.5 };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { label: 'NEUTRAL', score: 0.5 };
  }
}

export async function analyzeMessages(
  messages: ChatMessage[],
  onProgress?: (progress: AnalysisProgress) => void
): Promise<MessageWithSentiment[]> {
  const results: MessageWithSentiment[] = [];
  
  // Filter out media messages and very short messages
  const textMessages = messages.filter(
    m => !m.isMedia && m.message.trim().length > 3
  );
  
  // Sample messages if too many (analyze max 500 for performance)
  const sampled = textMessages.length > 500 
    ? sampleMessages(textMessages, 500)
    : textMessages;
  
  for (let i = 0; i < sampled.length; i++) {
    const msg = sampled[i];
    
    onProgress?.({
      current: i + 1,
      total: sampled.length,
      status: `Analyzing message ${i + 1} of ${sampled.length}...`,
    });
    
    const sentiment = await analyzeSentiment(msg.message);
    results.push({ ...msg, sentiment });
  }
  
  return results;
}

function sampleMessages(messages: ChatMessage[], count: number): ChatMessage[] {
  const step = Math.floor(messages.length / count);
  const sampled: ChatMessage[] = [];
  
  for (let i = 0; i < messages.length && sampled.length < count; i += step) {
    sampled.push(messages[i]);
  }
  
  return sampled;
}

export function aggregateSentimentByDay(
  messages: MessageWithSentiment[]
): SentimentTimeline[] {
  const byDay: Record<string, MessageWithSentiment[]> = {};
  
  messages.forEach(msg => {
    const dateKey = msg.timestamp.toISOString().split('T')[0];
    if (!byDay[dateKey]) {
      byDay[dateKey] = [];
    }
    byDay[dateKey].push(msg);
  });
  
  const timeline: SentimentTimeline[] = Object.entries(byDay)
    .map(([date, msgs]) => {
      const positive = msgs.filter(m => m.sentiment.label === 'POSITIVE').length;
      const negative = msgs.filter(m => m.sentiment.label === 'NEGATIVE').length;
      const neutral = msgs.filter(m => m.sentiment.label === 'NEUTRAL').length;
      
      const avgScore = msgs.reduce((acc, m) => {
        const score = m.sentiment.label === 'POSITIVE' ? m.sentiment.score : 
                      m.sentiment.label === 'NEGATIVE' ? -m.sentiment.score : 0;
        return acc + score;
      }, 0) / msgs.length;
      
      return {
        date,
        positive,
        negative,
        neutral,
        avgScore,
        messageCount: msgs.length,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return timeline;
}

export function getHighlightMoments(
  messages: MessageWithSentiment[],
  count: number = 5
): { positive: MessageWithSentiment[], negative: MessageWithSentiment[] } {
  const sorted = [...messages].sort((a, b) => b.sentiment.score - a.sentiment.score);
  
  const positive = sorted
    .filter(m => m.sentiment.label === 'POSITIVE')
    .slice(0, count);
    
  const negative = sorted
    .filter(m => m.sentiment.label === 'NEGATIVE')
    .slice(0, count);
  
  return { positive, negative };
}

export function calculateOverallStats(messages: MessageWithSentiment[]) {
  const total = messages.length;
  const positive = messages.filter(m => m.sentiment.label === 'POSITIVE').length;
  const negative = messages.filter(m => m.sentiment.label === 'NEGATIVE').length;
  const neutral = messages.filter(m => m.sentiment.label === 'NEUTRAL').length;
  
  const avgPositivity = messages.reduce((acc, m) => {
    if (m.sentiment.label === 'POSITIVE') return acc + m.sentiment.score;
    if (m.sentiment.label === 'NEGATIVE') return acc - m.sentiment.score;
    return acc;
  }, 0) / total;
  
  return {
    total,
    positive,
    negative,
    neutral,
    positivePercent: (positive / total) * 100,
    negativePercent: (negative / total) * 100,
    neutralPercent: (neutral / total) * 100,
    avgPositivity: (avgPositivity + 1) / 2 * 100, // Normalize to 0-100
  };
}
