// services/adventureLogService.ts

import type{ Message, StoryLogData } from '../types';

/**
 * Represents the complete data package for a single adventure session.
 * This is what will be saved to your database.
 */
export interface AdventurePayload {
  adventureId: string; // A unique ID for this game session
  startedAt: string;
  endedAt: string;
  messages: Message[];
  storyLog: StoryLogData;
  fanficContext?: string;
}

/**
 * Simulates saving the adventure to a backend.
 * In a real application, you would replace the setTimeout with a `fetch` call
 * to your backend endpoint (e.g., a Supabase Edge Function).
 *
 * @param payload The complete adventure data.
 */
const saveAdventure = async (payload: AdventurePayload): Promise<{ success: boolean; message: string }> => {
  console.log('--- SIMULATING ADVENTURE SAVE ---');
  console.log('Payload sent to backend:', payload);

  // =================================================================
  // ==  AQUI VOCÊ IRÁ SUBSTITUIR PELO SEU CÓDIGO DE BACKEND         ==
  // =================================================================
  //
  // Exemplo com fetch para uma Supabase Edge Function:
  //
  // try {
  //   const response = await fetch('https://<seu-projeto>.supabase.co/functions/v1/save-adventure', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`, // Ou sua chave de serviço se for do lado do servidor
  //     },
  //     body: JSON.stringify(payload),
  //   });
  //
  //   if (!response.ok) {
  //     throw new Error(`Failed to save adventure: ${response.statusText}`);
  //   }
  //
  //   const result = await response.json();
  //   console.log('Adventure saved successfully:', result);
  //   return { success: true, message: 'Adventure saved!' };
  //
  // } catch (error) {
  //   console.error('Error saving adventure:', error);
  //   return { success: false, message: 'Failed to save adventure.' };
  // }
  //
  // =================================================================
  
  // Simulating network delay
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('--- SIMULATION COMPLETE ---');
      resolve({ success: true, message: 'Adventure saved successfully (simulated).' });
    }, 1000);
  });
};


export const AdventureLogService = {
  saveAdventure,
};
