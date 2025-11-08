import Groq from 'groq-sdk';
import type { Message, StoryLogData } from '../types';
import { Roles } from '../types';

const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

if (!groqApiKey) {
  console.warn("VITE_GROQ_API_KEY is not defined. Fallback service will not be available.");
}

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true }) : null;

// Interface para o nosso objeto de resposta padronizado
interface ApiResponse {
  text: string;
  source: 'Gemini' | 'Groq';
}

// ====================================================================================
// NOTA IMPORTANTE: Esta função é uma cópia da que está em geminiService.ts.
// No futuro, seria uma boa prática mover esta função para um arquivo compartilhado
// (ex: src/lib/promptHelper.ts) para não ter código duplicado.
// ====================================================================================
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

const generateContentWithGroq = async (
  history: Message[],
  storyLog: StoryLogData,
  fanficContext?: string
): Promise<ApiResponse> => {
  if (!groq) {
    return { text: "Serviço de fallback (Groq) não está configurado.", source: 'Groq' };
  }

  try {
    const systemInstruction = getSystemInstruction(storyLog, history, fanficContext);
    
    // ====================================================================================
    // MUDANÇA PRINCIPAL AQUI: Correção de Tipagem
    // Usamos 'as const' para dizer ao TypeScript que os valores de 'role' são literais,
    // o que satisfaz a tipagem estrita da biblioteca da Groq.
    // ====================================================================================
    const systemMessage = { role: "system" as const, content: systemInstruction };
    
    const conversationMessages = history.map(msg => ({
      role: msg.role === Roles.USER ? "user" as const : "assistant" as const, // Groq usa 'assistant' para as respostas da IA
      content: msg.text,
    }));

    const messagesForApi = [
      systemMessage,
      ...conversationMessages
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messagesForApi,
      model: "llama3-8b-8192",
      temperature: 0.8,
      top_p: 0.9,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "O narrador alternativo ficou sem palavras.";
    return { text: responseText, source: 'Groq' };

  } catch (error) {
    console.error("Error generating content with Groq:", error);
    // Aqui a verificação 'instanceof Error' já é suficiente e correta.
    if (error instanceof Error) {
        return { text: `Desculpe, o narrador alternativo (Groq) também encontrou um erro: ${error.message}`, source: 'Groq' };
    }
    return { text: "O narrador alternativo também está tirando uma soneca.", source: 'Groq' };
  }
};

export const GroqService = {
  generateContent: generateContentWithGroq,
};