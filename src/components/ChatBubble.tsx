
import React from 'react';
import type { Message } from '../types';
import { Roles } from '../types';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === Roles.USER;

  const bubbleClasses = isUser
    ? 'bg-amber-100 text-stone-800 self-end rounded-br-none'
    : 'bg-white text-stone-900 self-start rounded-bl-none';
  
  const textContent = message.text.split('[ROLL_D20:')[0];

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`w-full max-w-2xl px-5 py-4 my-2 rounded-2xl shadow-sm transition-all duration-300 ${bubbleClasses}`}
      >
        <div 
          className="font-serif text-lg leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: textContent.replace(/\n/g, '<br />') }}
        />
      </div>
    </div>
  );
};
