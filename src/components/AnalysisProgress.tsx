import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, CheckCircle2 } from 'lucide-react';
import { AnalysisProgress as AnalysisProgressType } from '@/lib/sentimentAnalyzer';

interface AnalysisProgressProps {
  progress: AnalysisProgressType;
  isComplete: boolean;
}

export function AnalysisProgress({ progress, isComplete }: AnalysisProgressProps) {
  const percentage = Math.round((progress.current / progress.total) * 100);
  
  return (
    <div className="w-full max-w-xl mx-auto glass-card rounded-2xl p-8 slide-up">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
            isComplete 
              ? 'bg-gradient-to-br from-positive/20 to-positive/5' 
              : 'bg-gradient-to-br from-primary/20 to-accent/20'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-10 h-10 text-positive" />
            ) : (
              <Brain className="w-10 h-10 text-primary animate-pulse" />
            )}
          </div>
          {!isComplete && (
            <Loader2 className="absolute -bottom-2 -right-2 w-6 h-6 text-accent animate-spin" />
          )}
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {isComplete ? 'Analysis Complete!' : 'Analyzing Your Chat'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {progress.status}
          </p>
        </div>
        
        <div className="w-full space-y-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.current} / {progress.total}</span>
            <span>{percentage}%</span>
          </div>
        </div>
        
        {!isComplete && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Running locally in your browser</span>
          </div>
        )}
      </div>
    </div>
  );
}
