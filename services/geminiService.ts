import { GoogleGenAI } from "@google/genai";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// We assume this variable is pre-configured, valid, and accessible.
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateStudyAid = async (theme: string): Promise<string> => {
  if (!ai) {
    // Retorna mensagem silenciosa se não tiver API Key, sem quebrar o app
    return "";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      // FIX: Encapsulate the prompt string within the standard contents array structure for robustness.
      contents: [{
        parts: [{ 
          text: `Forneça 2 textos bíblicos principais e um breve ponto de reflexão (máximo 50 palavras) que se relacionem com o tema teocrático: "${theme}". Formate como uma lista simples HTML (<ul><li>...</li></ul>) sem markdown extra.`
        }]
      }],
    });
    
    return response.text || "Não foi possível gerar ajuda no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Erro de conexão com o assistente inteligente.";
  }
};