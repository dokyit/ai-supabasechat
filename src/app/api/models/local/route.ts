import ollama from 'ollama/browser';
export async function GET() {
  const { models } = await ollama.list();
  return Response.json(models.map(m => m.name));
}