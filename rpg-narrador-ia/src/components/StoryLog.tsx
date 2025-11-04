
import React from 'react';
import type { StoryLogData } from '../types';
import { Icon } from './Icons';

interface StoryLogProps {
  log: StoryLogData;
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="font-bold text-xl text-amber-800 border-b-2 border-amber-200 pb-2 mb-3 font-serif">{title}</h3>
    {children}
  </div>
);

export const StoryLog: React.FC<StoryLogProps> = ({ log, isOpen, onClose }) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-stone-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-stone-700 font-serif flex items-center">
              <Icon name="book" className="mr-3 text-amber-700" />
              Diário da Aventura
            </h2>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="overflow-y-auto flex-grow pr-2">
            <Section title="Cenário">
              <p className="text-stone-700 font-serif leading-relaxed">{log.setting || "Ainda não definido."}</p>
            </Section>
            <Section title="Personagens Notáveis">
              {log.characters.length > 0 ? (
                <ul className="list-none space-y-3">
                  {log.characters.map((char, index) => (
                    <li key={index} className="text-stone-700 font-serif leading-relaxed border-l-4 border-amber-200 pl-3">{char}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-600 italic font-serif">Nenhum personagem notável encontrado ainda.</p>
              )}
            </Section>
            <Section title="Eventos Importantes">
              {log.events.length > 0 ? (
                <ul className="list-none space-y-3">
                  {log.events.map((event, index) => (
                    <li key={index} className="text-stone-700 font-serif leading-relaxed border-l-4 border-amber-200 pl-3">{event}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-stone-600 italic font-serif">Nenhum evento importante ocorreu ainda.</p>
              )}
            </Section>
          </div>
        </div>
      </div>
    </>
  );
};
