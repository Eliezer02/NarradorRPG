import type { Message, StoryLogData } from '../types';
import { Roles } from '../types';

const xaiApiKey = import.meta.env.VITE_XAI_API_KEY;

if (!xaiApiKey) {
  console.warn("VITE_XAI_API_KEY is not defined. Fallback service (Grok) will not be available.");
}

// ====================================================================================
// MUDANÇA PRINCIPAL AQUI: A função está agora completa e utiliza todos os seus argumentos.
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
        model: "grok-1", // Modelo da xAI
        messages: messagesForApi,
        temperature: 0.8,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
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