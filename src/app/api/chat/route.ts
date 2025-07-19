import { NextRequest, NextResponse } from 'next/server';
import ollama from 'ollama/browser';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function fetchRemote(providerModel: string, prompt: string, key: string) {
  const [provider, model] = providerModel.split('::');
  // generic fetcher for openai-clone endpoints
  const res = await fetch(`https://api.${provider}.com/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
  });
  const json = await res.json();
  return json.choices[0].message.content;
}

export async function POST(req: NextRequest) {
  const { message, model, conversationId } = await req.json();

  await sb.from('messages').insert({ conversation_id: conversationId, role: 'user', content: message, model });

  let reply = '';
  if (model.startsWith('remote::')) {
    const apiKey = ''; // TODO fetch from user_keys table (decrypt)
    reply = await fetchRemote(model.replace('remote::', ''), message, apiKey);
  } else {
    const stream = await ollama.chat({ model, messages: [{ role: 'user', content: message }], stream: true });
    for await (const chunk of stream) {
      reply += chunk.message.content;
    }
  }

  await sb.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: reply, model });
  return NextResponse.json({ reply });
}