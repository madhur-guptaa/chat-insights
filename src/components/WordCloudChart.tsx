import React from 'react';
import WordCloud from 'react-d3-cloud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WordCloudChartProps {
  data: { text: string; value: number }[];
}

const fontSizeMapper = (word: { value: number }) => Math.log2(word.value) * 5 + 16;

export function WordCloudChart({ data }: WordCloudChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Word Cloud</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
          No sufficient data to generate word cloud.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Word Cloud</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full flex items-center justify-center">
        <div style={{ width: '500px', height: '280px' }}>
          <WordCloud
            data={data}
            width={500}
            height={280}
            font="Inter"
            fontSize={fontSizeMapper}
            rotate={0}
            padding={2}
            fill="#333333" // Changed to a standard dark gray for better aesthetics
          />
        </div>
      </CardContent>
    </Card>
  );
}