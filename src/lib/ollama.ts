import ollama from 'ollama/browser';

export async function listLocalModels() {
  const { models } = await ollama.list();
  return models.map(m => m.name);
}