// src/services/xaiService.ts

import type { Message, StoryLogData } from '../types';
import { Roles } from '../types';

const xaiApiKey = import.meta.env.VITE_XAI_API_KEY;

if (!xaiApiKey) {
  console.warn("VITE_XAI_API_KEY is not defined. Fallback service (Grok) will not be available.");
}

// A mesma função de prompt.
const getSystemInstruction = (log: StoryLogData, history: Message[], fanficContext?: string): string => {
    // ... cole sua função getSystemInstruction completa aqui ...
    return `...`;
};

// Interface para o retorno padronizado
interface ApiResponse {
  text: string;
  source: 'Gemini' | 'Grok';
}

const generateContentWithGrok = async (
  history: Message[],
  storyLog: StoryLogData,
  fanficContext?: string
): Promise<ApiResponse> => {
  if (!xaiApiKey) {
    return { text: "Serviço de fallback (Grok) não está configurado.", source: 'Grok' };
  }

  const systemInstruction = getSystemInstruction(storyLog, history, fanficContext);
  
  // A API da xAI espera um formato de mensagem específico
  const messagesForApi = [
    { role: "system", content: systemInstruction },
    ...history.map(msg => ({
      role: msg.role === Roles.USER ? "user" : "assistant",
      content: msg.text,
    }))
  ];

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "grok-4-fast-non-reasoning", // O nome do modelo da xAI
        messages: messagesForApi,
        temperature: 0.8,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      // Tenta ler o erro da API para dar mais detalhes
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "O narrador alternativo (Grok) ficou sem palavras.";
    
    return { text: responseText, source: 'Grok' };

  } catch (error) {
    console.error("Error generating content with Grok (xAI):", error);
    if (error instanceof Error) {
        return { text: `Desculpe, o narrador alternativo (Grok) também encontrou um erro: ${error.message}`, source: 'Grok' };
    }
    return { text: "O narrador alternativo também está tirando uma soneca.", source: 'Grok' };
  }
};

export const XAIService = {
  generateContent: generateContentWithGrok,
};