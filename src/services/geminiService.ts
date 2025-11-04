import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Message, StoryLogData } from '../types';
import { Roles } from '../types';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("VITE_API_KEY environment variable not set. Please check your .env.local file.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_NAME = 'gemini-2.5-pro';

// A função getSystemInstruction não precisa de nenhuma mudança.
const getSystemInstruction = (log: StoryLogData, history: Message[], fanficContext?: string): string => {
  let initialPromptDirective = '';
  if (history.length === 1 && history[0].role === Roles.USER) {
      initialPromptDirective = `
**Starting the Game:**
The user has just described their character and the kind of adventure they want. Your first task is to use this information to create a captivating opening scene. Introduce the world, set the mood, and present the player with their first situation or challenge based on their input.
${fanficContext ? "Crucially, your opening scene must acknowledge the inspirational text provided. Start your response with a phrase like 'Inspirado pela história que você compartilhou, nossa aventura começa...' to confirm you have processed the context, then proceed with the narrative, subtly reflecting its tone and themes." : ""}
This is your only instruction for this turn. After this, revert to the core directives.
---
      `;
  }
  return `
${initialPromptDirective}
You are a master storyteller and dungeon master for a text-based RPG. Your goal is to create a deeply immersive and engaging narrative for a single player.

**Core Directives:**
1.  **Narrate the World:** Describe the environment, characters, and events with rich, evocative language. Focus on creating a comfortable and enjoyable reading experience. Use paragraphs and proper formatting. The language is Portuguese from Brazil.
2.  **Respond to the Player:** Adapt the story based on the player's actions and decisions. Their choices have consequences.
3.  **Maintain a Story Log:** After every 3 player turns, provide an updated summary of the story's key elements. The summary must be a JSON object enclosed in triple backticks, like this:
    \`\`\`json
    {
      "characters": ["Name: Description of character.", "Another Name: Description of character."],
      "setting": "Detailed description of the current location and world.",
      "events": ["Summary of a key event that happened.", "Summary of another key event."]
    }
    \`\`\`
    This JSON block should be the VERY LAST thing in your response when you provide it.
4.  **Challenge the Player:** At pivotal moments in the story where the outcome is uncertain (like combat, persuasion, or difficult tasks), you MUST prompt the player for a dice roll. To do this, end your narrative with the exact token: \`[ROLL_D20:description of the check]\`. For example: \`[ROLL_D20:Tentar se esgueirar pelo dragão adormecido]\`. Do NOT simulate the roll yourself. Wait for the player's roll result before continuing the story for that action.

**Current Story Log (for your reference):**
\`\`\`json
${JSON.stringify(log, null, 2)}
\`\`\`

${fanficContext ? `**Inspirational Context:**
The player has provided the following text for style, tone, and world-building inspiration. Use it as a guide for the narrative.
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
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: getSystemInstruction(storyLog, history, fanficContext)
    });

  
    const historyForApi = history.length <= 2 ? [] : history.slice(0, -1);

    const chat = model.startChat({
      history: historyForApi.map(msg => ({
        role: msg.role === Roles.USER ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
      }
    });

    const userMessage = history[history.length - 1].text;
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    return response.text();

  } catch (error) {
    console.error("Error generating content:", error);
    return "Desculpe, o mestre da masmorra parece estar tirando uma soneca. Por favor, tente novamente em um momento.";
  }
};

export const GeminiService = {
  generateContent,
};