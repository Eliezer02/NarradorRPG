// src/services/adventureLogService.ts

import type { Message, StoryLogData } from '../types';

export interface AdventurePayload {
  adventureId: string;
  startedAt: string;
  endedAt: string;
  messages: Message[];
  storyLog: StoryLogData;
  fanficContext?: string;
}

const saveAdventure = async (payload: AdventurePayload): Promise<{ success: boolean; message: string }> => {
  console.log('--- SENDING ADVENTURE TO REAL BACKEND ---');
  console.log('Payload:', payload);

  try {
    // A URL '/api/save-adventure' funciona tanto localmente (com 'vercel dev')
    // quanto em produção na Vercel.
    const response = await fetch('/api/save-adventure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        // Lançamos um erro para que ele seja pego pelo bloco catch abaixo.
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Backend response:', result.message);
    return { success: true, message: 'Adventure saved to backend.' };

  } catch (error) {
    const err = error as Error;
    console.error('Error saving adventure to backend:', err.message);
    // Mesmo que falhe, retornamos sucesso para o frontend não travar a experiência do usuário.
    // O erro importante fica registrado no console do desenvolvedor (aqui) ou nos logs da Vercel.
    return { success: false, message: err.message };
  }
};

export const AdventureLogService = {
  saveAdventure,
};