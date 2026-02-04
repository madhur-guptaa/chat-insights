interface MoodScoreProps {
    score: number; // 0-100
}

export function MoodScore({score}: MoodScoreProps) {
    const getMoodEmoji = () => {
        if (score >= 70) return '😊';
        if (score >= 55) return '🙂';
        if (score >= 45) return '😐';
        if (score >= 30) return '😕';
        return '😢';
    };

    const getMoodLabel = () => {
        if (score >= 70) return 'Very Positive';
        if (score >= 55) return 'Positive';
        if (score >= 45) return 'Neutral';
        if (score >= 30) return 'Slightly Negative';
        return 'Negative';
    };

    const getMoodColor = () => {
        if (score >= 55) return 'from-positive to-positive/70';
        if (score >= 45) return 'from-neutral to-neutral/70';
        return 'from-negative to-negative/70';
    };

    return (
        <div className="glass-card rounded-2xl p-8 text-center fade-in">
            <div className="mb-4">
                <span className="text-6xl">{getMoodEmoji()}</span>
            </div>

            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Overall Mood Score
            </h3>

            <div className="relative mb-4">
        <span className={`text-6xl font-bold bg-gradient-to-r ${getMoodColor()} bg-clip-text text-transparent`}>
          {Math.round(score)}
        </span>
                <span className="text-2xl text-muted-foreground">/100</span>
            </div>

            <p className="text-lg font-medium text-foreground">
                {getMoodLabel()}
            </p>

            {/* Score bar */}
            <div className="mt-6 w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${getMoodColor()} transition-all duration-1000 ease-out`}
                    style={{width: `${score}%`}}
                />
            </div>

            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
            </div>
        </div>
    );
}
