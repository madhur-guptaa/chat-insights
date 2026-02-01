export interface ChatMessage {
  timestamp: Date;
  sender: string;
  message: string;
  isMedia: boolean;
}

export interface ParsedChat {
  messages: ChatMessage[];
  participants: string[];
  startDate: Date;
  endDate: Date;
  totalMessages: number;
  messagesByParticipant: Record<string, number>;
}

// WhatsApp export formats vary by region/device
// Common formats:
// [DD/MM/YYYY, HH:MM:SS] Sender: Message
// DD/MM/YYYY, HH:MM - Sender: Message
// MM/DD/YY, HH:MM AM/PM - Sender: Message
const MESSAGE_PATTERNS = [
  // Format: [DD/MM/YYYY, HH:MM:SS] Sender: Message
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.*)$/i,
  // Format: DD/MM/YYYY, HH:MM - Sender: Message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)$/i,
  // Format: MM/DD/YY, HH:MM AM/PM - Sender: Message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*-\s*([^:]+):\s*(.*)$/i,
];

function parseDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    // Try different date formats
    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) return null;

    let day: number, month: number, year: number;
    
    // Check if first part could be month (1-12) or day (1-31)
    const first = parseInt(dateParts[0]);
    const second = parseInt(dateParts[1]);
    
    // If first > 12, it's definitely day/month/year
    if (first > 12) {
      day = first;
      month = second - 1;
      year = parseInt(dateParts[2]);
    } else if (second > 12) {
      // month/day/year format
      month = first - 1;
      day = second;
      year = parseInt(dateParts[2]);
    } else {
      // Assume day/month/year (more common internationally)
      day = first;
      month = second - 1;
      year = parseInt(dateParts[2]);
    }

    // Handle 2-digit years
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }

    // Parse time
    let hours = 0, minutes = 0;
    const timeParts = timeStr.trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
    
    if (timeParts) {
      hours = parseInt(timeParts[1]);
      minutes = parseInt(timeParts[2]);
      
      // Handle AM/PM
      const ampm = timeParts[4];
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    }

    return new Date(year, month, day, hours, minutes);
  } catch {
    return null;
  }
}

export function parseWhatsAppChat(content: string): ParsedChat {
  const lines = content.split('\n');
  const messages: ChatMessage[] = [];
  const participantsSet = new Set<string>();
  const messagesByParticipant: Record<string, number> = {};
  
  let currentMessage: Partial<ChatMessage> | null = null;

  for (const line of lines) {
    let matched = false;
    
    for (const pattern of MESSAGE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // Save previous message if exists
        if (currentMessage?.timestamp && currentMessage?.sender) {
          messages.push(currentMessage as ChatMessage);
        }
        
        const [, dateStr, timeStr, sender, message] = match;
        const timestamp = parseDateTime(dateStr, timeStr);
        
        if (timestamp && sender) {
          const trimmedSender = sender.trim();
          const trimmedMessage = message?.trim() || '';
          
          // Skip system messages
          if (!trimmedSender.includes('Messages and calls are end-to-end encrypted') &&
              !trimmedSender.includes('created group') &&
              !trimmedSender.includes('added') &&
              !trimmedSender.includes('left') &&
              !trimmedSender.includes('changed')) {
            
            participantsSet.add(trimmedSender);
            messagesByParticipant[trimmedSender] = (messagesByParticipant[trimmedSender] || 0) + 1;
            
            currentMessage = {
              timestamp,
              sender: trimmedSender,
              message: trimmedMessage,
              isMedia: trimmedMessage.includes('<Media omitted>') || 
                       trimmedMessage.includes('image omitted') ||
                       trimmedMessage.includes('video omitted') ||
                       trimmedMessage.includes('audio omitted') ||
                       trimmedMessage.includes('sticker omitted') ||
                       trimmedMessage.includes('GIF omitted'),
            };
            matched = true;
          }
        }
        break;
      }
    }
    
    // If not a new message, append to current message (multi-line messages)
    if (!matched && currentMessage && line.trim()) {
      currentMessage.message = (currentMessage.message || '') + '\n' + line.trim();
    }
  }
  
  // Don't forget the last message
  if (currentMessage?.timestamp && currentMessage?.sender) {
    messages.push(currentMessage as ChatMessage);
  }

  const participants = Array.from(participantsSet);
  const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return {
    messages: sortedMessages,
    participants,
    startDate: sortedMessages[0]?.timestamp || new Date(),
    endDate: sortedMessages[sortedMessages.length - 1]?.timestamp || new Date(),
    totalMessages: sortedMessages.length,
    messagesByParticipant,
  };
}
