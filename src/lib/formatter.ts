export function clean(text: string) {
  // Defensive: ensure text is a string
  const str = typeof text === 'string' ? text : (text == null ? '' : String(text));
  // remove <think>...</think> or <reasoning>...</reasoning>
  return str
    .replace(/<think>[\s\S]*?<\/think>/gi, '')  // strip thinking
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .trim();
}

export function extractThinking(text: string) {
  // Defensive: ensure text is a string
  const str = typeof text === 'string' ? text : (text == null ? '' : String(text));
  const m = str.match(/<think>([\s\S]*?)<\/think>/gi);
  return m ? m.join('\n') : '';
}