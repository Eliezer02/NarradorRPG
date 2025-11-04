import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icons';

// A interface de props principal para o UserInput não muda.
interface UserInputProps {
  onSubmit: (text: string) => void;
  onContextSubmit: (context: string) => void;
  disabled: boolean;
  gameStarted: boolean;
  saveExists: boolean;
  onLoadGame: () => void;
}

// ====================================================================================
// MUDANÇA 1: Componentes movidos para fora do escopo do UserInput.
// Eles agora são componentes "puros" que recebem tudo o que precisam via props.
// Isso garante que eles não sejam recriados a cada renderização do componente pai.
// ====================================================================================

interface WelcomeScreenProps {
  onLoadGame: () => void;
  onNewGameClick: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLoadGame, onNewGameClick }) => (
  <div className="p-6 bg-white/80 backdrop-blur-sm rounded-t-2xl shadow-lg border-t border-stone-200 text-center">
    <h2 className="text-2xl font-bold text-stone-800 mb-4 font-serif">Bem-vindo, Aventureiro!</h2>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button 
        onClick={onLoadGame}
        className="flex-1 px-6 py-3 bg-amber-600 text-white font-bold rounded-lg shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-transform duration-150 ease-in-out hover:scale-105"
      >
        Continuar Aventura
      </button>
      <button 
        onClick={onNewGameClick}
        className="flex-1 px-6 py-3 bg-stone-500 text-white font-bold rounded-lg shadow-md hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-opacity-50 transition-transform duration-150 ease-in-out hover:scale-105"
      >
        Nova Aventura
      </button>
    </div>
  </div>
);

interface ContextScreenProps {
  context: string;
  setContext: (value: string) => void;
  handleContextSubmit: (event: React.FormEvent) => void;
}

const ContextScreen: React.FC<ContextScreenProps> = ({ context, setContext, handleContextSubmit }) => (
  <div className="p-6 bg-white/80 backdrop-blur-sm rounded-t-2xl shadow-lg border-t border-stone-200">
    <h2 className="text-xl font-bold text-stone-800 mb-3 text-center">Comece sua Aventura</h2>
    <p className="text-stone-600 mb-4 text-center">Para personalizar sua história, cole um trecho de uma fanfic que você gosta. A IA não consegue ler links, então cole o texto diretamente aqui. Ou simplesmente comece uma nova aventura!</p>
    <form onSubmit={handleContextSubmit}>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Cole o texto da sua fanfic aqui... (opcional)"
        className="w-full p-3 border border-stone-300 rounded-lg mb-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow duration-200 resize-none h-32"
      />
      <button type="submit" className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-lg shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-transform duration-150 ease-in-out hover:scale-105 disabled:bg-stone-400">
        Iniciar Aventura
      </button>
    </form>
  </div>
);


// ====================================================================================
// MUDANÇA 2: O componente UserInput agora gerencia o estado e passa as props
// para os sub-componentes que acabamos de mover.
// ====================================================================================

export const UserInput: React.FC<UserInputProps> = ({ onSubmit, onContextSubmit, disabled, gameStarted, saveExists, onLoadGame }) => {
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [showContextForm, setShowContextForm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
      setText('');
    } else {
      onSubmit('');
      setText('');
    }
  };
  
  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContextSubmit(context);
  };

  const handleNewGameClick = () => {
    if (window.confirm("Tem certeza de que deseja iniciar uma nova aventura? Seu progresso salvo anteriormente será perdido.")) {
      localStorage.removeItem('rpgNarratorSaveData');
      setShowContextForm(true);
    }
  };

  // A lógica de renderização condicional agora chama os componentes estáveis,
  // passando as funções e o estado de que eles precisam como props.
  if (!gameStarted) {
    if (saveExists && !showContextForm) {
      return <WelcomeScreen onLoadGame={onLoadGame} onNewGameClick={handleNewGameClick} />;
    }
    return <ContextScreen context={context} setContext={setContext} handleContextSubmit={handleContextSubmit} />;
  }

  // O JSX do formulário principal permanece o mesmo.
  // Como a estrutura acima é estável, o React não vai mais recriar este formulário
  // desnecessariamente, resolvendo o problema de perda de foco.
  return (
    <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-stone-200">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={disabled ? "Aguarde a resposta do narrador..." : "O que você faz?"}
          disabled={disabled}
          className="flex-grow p-3 bg-stone-100 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow duration-200 resize-none max-h-40 text-stone-900"
          rows={1}
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex-shrink-0 w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-transform duration-150 ease-in-out hover:scale-110 disabled:bg-stone-400 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {disabled ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Icon name="send" />}
        </button>
      </form>
    </div>
  );
};