import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Message, StoryLogData } from '../types';
import { Roles } from '../types';
import { XAIService } from './xaiService'; // MUDANÇA: Importa o novo serviço da xAI

// Interface para o retorno padronizado
interface ApiResponse {
  text: string;
  source: 'Gemini' | 'Grok'; // MUDANÇA: Atualizado para 'Grok'
}

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("VITE_API_KEY environment variable not set. Please check your .env.local file.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = 'gemini-2.5-flash';

const getSystemInstruction = (log: StoryLogData, history: Message[], fanficContext?: string): string => {
  let initialPromptDirective = '';
  if (history.length === 1 && history[0].role === Roles.USER) {
      initialPromptDirective = `
**Starting the Story:**
The user has just described their character and the kind of story they want. Your first task is to use this information to write a captivating opening chapter. Introduce the world, set the mood, and present the character with their initial situation based on their input.
${fanficContext ? "Crucially, your opening must acknowledge the inspirational text provided. Start your response with a phrase like 'Inspirado pela história que você compartilhou, nossa narrativa começa...' to confirm you have processed the context, then proceed with the story, subtly reflecting its tone and themes." : ""}
This is your only instruction for this turn. After this, revert to the core directives.
---
      `;
  }
  return `
${initialPromptDirective}
You are a talented, collaborative author specializing in interactive fanfiction. Your goal is to co-create a rich, character-driven story with the user, where their choices shape the narrative.

**Core Directives:**
1.  **Weave a Compelling Narrative:** Describe the world, characters, and events with rich, evocative language. Focus on character emotions, internal thoughts, and sensory details to create a deeply immersive reading experience. The language is Portuguese from Brazil.
2.  **Honor User Choices:** The user directs the story. Adapt the narrative based on their decisions. Their choices lead to new branches and developments in the plot and character relationships.
3.  **Maintain a Story Journal:** After every 3 user turns, provide an updated summary of the story's key elements. The summary must be a JSON object enclosed in triple backticks, with a more literary feel:
    \`\`\`json
    {
      "castOfCharacters": ["Name: Role in the story, key traits.", "Another Name: ..."],
      "worldAndSetting": "Detailed description of the current location, mood, and relevant world-building.",
      "keyPlotPoints": ["Summary of a key scene or development.", "Summary of another important moment."]
    }
    \`\`\`
    This JSON block should be the VERY LAST thing in your response when you provide it.
4.  **Moments of Chance (Optional):** Only in rare situations of extreme tension or pure chance where the outcome is truly uncertain, you can prompt for a dice roll. Most actions should be resolved through narrative. If you must, use the token: \`[ROLL_D20:description of the uncertain action]\`.

**Current Story Journal (for your reference):**
\`\`\`json
${JSON.stringify(log, null, 2)}
\`\`\`

${fanficContext ? `**Inspirational Context:**
The user has provided the text for style, tone, and world-building inspiration. Use it as a guide.
---
${fanficContext}
---
` : ''}
`;
};


const generateContent = async (
  history: Message[],
  storyLog: StoryLogData,
  fanficContext?: string
): Promise<ApiResponse> => {
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: getSystemInstruction(storyLog, history, fanficContext)
    });

    const chat = model.startChat({
      history: history.slice(0, -1).map(msg => ({
        role: msg.role === Roles.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
    });

    const userMessage = history[history.length - 1].text;
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    
    return { text: response.text(), source: 'Gemini' };

  } catch (error) {
    console.error("Error with Gemini, attempting fallback to Grok (xAI):", error);

    const errorMessage = error instanceof Error ? error.toString() : String(error);

    if (errorMessage.includes('503') || errorMessage.includes('400') || errorMessage.includes('404') || errorMessage.includes('429')) {
        console.log("Gemini failed with a recoverable error. Calling Grok (xAI) as a fallback...");
        // MUDANÇA: Chamando o XAIService em vez do GroqService
        return XAIService.generateContent(history, storyLog, fanficContext);
    }
    
    if (error instanceof Error) {
        return { text: `Desculpe, ocorreu um erro inesperado com a IA: ${error.message}`, source: 'Gemini' };
    }
    return { text: "Desculpe, o mestre da masmorra parece estar tirando uma soneca.", source: 'Gemini' };
  }
};

export const GeminiService = {
  generateContent,
};