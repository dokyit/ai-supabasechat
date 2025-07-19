import ollama from 'ollama/browser';
export async function POST(req: Request) {
  const { model } = await req.json();
  await ollama.pull({ model });
  return Response.json({ ok: true });
}