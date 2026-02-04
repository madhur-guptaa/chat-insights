import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List, Dict, Any

import emoji
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException
from textblob import TextBlob

app = FastAPI()

# --- Stop Words for Word Cloud ---
STOP_WORDS = set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", "be",
    "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "did", "do", "does",
    "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he",
    "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its",
    "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same", "she", "should", "so",
    "some", "such", "t", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these",
    "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what",
    "when", "where", "which", "while", "who", "whom", "why", "will", "with", "you", "your", "yours", "yourself",
    "yourselves", "omitted", "image", "video", "audio", "sticker", "gif", "media"
])


# --- Parsing Logic ---
def parse_chat_content(content: str) -> List[Dict[str, Any]]:
    # Corrected, robust patterns
    patterns = [
        re.compile(r'\[(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2}:\d{2})\]\s*([^:]+):\s*(.*)'),
        re.compile(r'(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2}:\d{2})\]\s*([^:]+):\s*(.*)'),
        re.compile(r'(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)')
    ]
    messages, current_message = [], None
    for line in content.splitlines():
        match = next((p.match(line) for p in patterns if p.match(line)), None)
        if match:
            if current_message: messages.append(current_message)
            groups = match.groups()
            date_str, time_str, sender, message_text = groups[0], groups[1], groups[2], groups[3]
            try:
                dt_format = '%m/%d/%y %I:%M %p' if '/' in date_str else '%Y-%m-%d %H:%M:%S'
                dt_obj = datetime.strptime(f"{date_str} {time_str}", dt_format)
            except ValueError:
                continue
            current_message = {"timestamp": dt_obj, "sender": sender.strip(), "message": message_text.strip()}
        elif current_message and line.strip():
            current_message["message"] += f"\n{line.strip()}"
    if current_message: messages.append(current_message)
    return messages


# --- Analysis Helper Functions ---
def calculate_response_times(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    response_times = defaultdict(list)
    last_sender, last_timestamp = (None, None)
    if messages:
        last_sender, last_timestamp = messages[0]['sender'], messages[0]['timestamp']
    for msg in messages[1:]:
        if msg['sender'] != last_sender:
            diff = msg['timestamp'] - last_timestamp
            response_times[msg['sender']].append(diff.total_seconds())
        last_sender, last_timestamp = msg['sender'], msg['timestamp']
    return [{"name": sender, "seconds": sum(times) / len(times)} for sender, times in response_times.items() if times]


def find_sentiment_shifts(messages: List[Dict[str, Any]], top_n: int = 3) -> Dict[str, List[Dict[str, Any]]]:
    if len(messages) < 2: return {"positive": [], "negative": []}
    diffs = [messages[i]['rolling_avg_sentiment'] - messages[i - 1]['rolling_avg_sentiment'] for i in
             range(1, len(messages))]
    diffs.insert(0, 0)
    indexed_diffs = list(enumerate(diffs))
    positive_shifts = sorted(indexed_diffs, key=lambda item: item[1], reverse=True)[:top_n]
    negative_shifts = sorted(indexed_diffs, key=lambda item: item[1])[:top_n]
    return {
        "positive": [messages[i] for i, diff in positive_shifts if diff > 0.1],
        "negative": [messages[i] for i, diff in negative_shifts if diff < -0.1]
    }


# --- API Endpoint ---
@app.post("/api/analyze")
async def analyze_chat_endpoint(file: UploadFile = File(...)):
    chat_text = (await file.read()).decode("utf-8", errors='ignore')
    parsed_messages = parse_chat_content(chat_text)
    if not parsed_messages:
        raise HTTPException(status_code=422, detail="Could not parse any messages.")

    sentiments = [TextBlob(msg['message']).sentiment.polarity for msg in parsed_messages]
    sentiment_series = pd.Series(sentiments)
    rolling_avg = sentiment_series.rolling(window=20, min_periods=1).mean().tolist()
    is_negative = sentiment_series.apply(lambda x: x < -0.3)
    negativity_cluster = is_negative.rolling(window=5, min_periods=1).sum().apply(lambda x: x >= 3).tolist()

    enriched_messages = []
    for i, msg in enumerate(parsed_messages):
        enriched_messages.append({
            "timestamp": msg['timestamp'], "sender": msg['sender'], "message": msg['message'],
            "sentiment_polarity": sentiments[i], "rolling_avg_sentiment": rolling_avg[i],
            "is_negativity_cluster": negativity_cluster[i],
        })

    # Get participant names and add to stop words for word cloud
    participant_names = list(set(msg['sender'] for msg in parsed_messages))
    # Split names that are multi-word (e.g., "John Doe" -> "john", "doe")
    participant_stopwords = set()
    for name in participant_names:
        for part in name.lower().split():
            participant_stopwords.add(part)

    # Combine global stop words with participant names
    stop_words_for_wc = STOP_WORDS.union(participant_stopwords)

    text = " ".join([msg['message'] for msg in parsed_messages]).lower()
    words = re.findall(r'\b\w+\b', text)
    filtered_words = [word for word in words if word not in stop_words_for_wc and len(word) >= 4]
    word_cloud_data = [{"text": word, "value": count} for word, count in Counter(filtered_words).most_common(50)]
    hourly, daily = Counter(msg['timestamp'].hour for msg in parsed_messages), Counter(
        msg['timestamp'].weekday() for msg in parsed_messages)
    day_map = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun'}
    all_emojis = [c for msg in parsed_messages for c in msg['message'] if c in emoji.EMOJI_DATA]
    starters = Counter()
    if parsed_messages:
        starters[parsed_messages[0]['sender']] += 1
        for i in range(1, len(parsed_messages)):
            if (parsed_messages[i]['timestamp'] - parsed_messages[i - 1]['timestamp']) > timedelta(hours=4):
                starters[parsed_messages[i]['sender']] += 1

    sentiment_shifts = find_sentiment_shifts(enriched_messages)
    for msg in enriched_messages: msg['timestamp'] = msg['timestamp'].isoformat()

    return {
        "messages": enriched_messages,
        "metadata": {
            "participants": list(set(msg['sender'] for msg in parsed_messages)),
            "total_messages": len(parsed_messages),
            "messages_by_participant": dict(Counter(msg['sender'] for msg in parsed_messages)),
            "start_date": parsed_messages[0]['timestamp'].isoformat(),
            "end_date": parsed_messages[-1]['timestamp'].isoformat(),
        },
        "additional_metrics": {
            "activity": {"by_hour": [{"hour": h, "messages": c} for h, c in sorted(hourly.items())],
                         "by_day": [{"day": day_map[d], "messages": c} for d, c in sorted(daily.items())]},
            "emojis": [{"emoji": e, "count": c} for e, c in Counter(all_emojis).most_common(15)],
            "starters": [{"name": n, "count": c} for n, c in starters.items()],
            "word_cloud": word_cloud_data,
            "avg_response_times": calculate_response_times(parsed_messages),
            "sentiment_shifts": sentiment_shifts,
        }
    }
