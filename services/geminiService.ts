
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- HELPER: RETRY LOGIC ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = error.message?.toLowerCase() || '';
      const isNetworkError = msg.includes('xhr') || msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch');
      const isServerError = error.code === 500 || error.code === 503 || error.status === 500 || error.status === 503;
      
      if (isNetworkError || isServerError) {
        console.warn(`Gemini API Attempt ${i + 1} failed. Retrying in ${backoff}ms...`, error);
        await wait(backoff);
        backoff *= 2;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// --- GENERIC API WRAPPERS ---

export const generateJSON = async (
    prompt: string, 
    schema: any, 
    systemInstruction?: string,
    model: string = 'gemini-2.5-flash',
    images: {mimeType: string, data: string}[] = []
): Promise<any> => {
    return withRetry(async () => {
        const parts: any[] = [{ text: prompt }];
        images.forEach(img => {
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        });

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                systemInstruction: systemInstruction
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        return JSON.parse(text);
    });
};

export const createChatSession = (systemInstruction: string, tools: any[] = []): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
            tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined
        }
    });
};

// --- IMAGE GENERATION (Kept here as it's a specific model capability) ---

export const generateRealisticRender = async (blueprintImage: string, prompt: string): Promise<string> => {
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: blueprintImage } },
                    { text: prompt }
                ]
            }
        });

        let base64Image = '';
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    base64Image = part.inlineData.data;
                    break;
                }
            }
        }

        if (!base64Image) {
            throw new Error("No image generated.");
        }

        return `data:image/png;base64,${base64Image}`;
    });
};
