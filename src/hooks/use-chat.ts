import { useState } from 'react';
export default function useChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [thinking, setThinking] = useState(false);

  const send = async (text: string, model: string, convoId: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setThinking(true);
    const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message: text, model, conversationId: convoId }) });
    const { reply } = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setThinking(false);
  };
  return { messages, send, thinking };
}