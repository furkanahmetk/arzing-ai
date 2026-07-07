import { ChatOpenAI } from "@langchain/openai";

const MODEL = process.env.OPENROUTER_MODEL || "google/gemma-3-27b-it";

export function getLLM(opts: { temperature?: number } = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY tanımlı değil (.env dosyasını kontrol et)");
  }

  return new ChatOpenAI({
    modelName: MODEL,
    // Audit'te düşük temperature tercih edilir: aynı kontratı tekrar taradığında
    // tutarlı sonuç almak, rapor zincire hash'lenirken güven açısından önemli.
    temperature: opts.temperature ?? 0.1,
    apiKey: process.env.OPENROUTER_API_KEY,
    openAIApiKey: process.env.OPENROUTER_API_KEY, // keep for backwards compat
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://arzing-ai.example.com",
        "X-Title": "Arzing AI",
      },
    },
  });
}
