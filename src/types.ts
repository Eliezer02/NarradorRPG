// src/types.ts

export type Role = 'user' | 'model' | 'system';

export const Roles = {
  USER: 'user' as Role,
  MODEL: 'model' as Role,
  SYSTEM: 'system' as Role
}

export interface Message {
  role: Role;
  text: string;
  id: string;
}


export interface StoryLogData {
  castOfCharacters: string[]; 
  worldAndSetting: string;   
  keyPlotPoints: string[];   
}

export interface DiceRollRequest {
  reason: string;
}