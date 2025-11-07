import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Message, StoryLogData, DiceRollRequest } from '../types';
import { Roles } from '../types';
import { GeminiService } from '../services/geminiService';
import { AdventureLogService } from '../services/adventureLogService';
import { ChatBubble } from '../components/ChatBubble';
import { UserInput } from '../components/UserInput';
import { StoryLog } from '../components/StoryLog';
import { Icon } from '../components/Icons';
import { DiceRoller } from '../components/DiceRoller';

interface SaveState {
  messages: Message[];
  storyLog: StoryLogData;
  fanficContext?: string;
  gameStarted: boolean;
  actionCount: number;
}

const SAVE_KEY = 'rpgNarratorSaveData';

const GamePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  // Atualizado para usar os novos nomes do StoryLog
  const [storyLog, setStoryLog] = useState<StoryLogData>({ castOfCharacters: [], worldAndSetting: '', keyPlotPoints: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [fanficContext, setFanficContext] = useState<string | undefined>(undefined);
  const [gameStarted, setGameStarted] = useState(false);
  const [diceRollRequest, setDiceRollRequest] = useState<DiceRollRequest | null>(null);
  const [saveExists, setSaveExists] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const actionCountRef = useRef(0);
  const adventureMetaRef = useRef({
    id: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startedAt: new Date().toISOString(),
  });
  
  useEffect(() => {
    if (localStorage.getItem(SAVE_KEY)) {
      setSaveExists(true);
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const processApiResponse = (responseText: string) => {
    let narrative = responseText;
    
    const logRegex = /```json\s*([\s\S]*?)\s*```/;
    const logMatch = responseText.match(logRegex);
    if (logMatch && logMatch[1]) {
      try {
        const newLog = JSON.parse(logMatch[1]);
        setStoryLog(prevLog => ({ ...prevLog, ...newLog }));
        narrative = narrative.replace(logRegex, '').trim();
      } catch (e) {
        console.error("Failed to parse story log JSON:", e);
      }
    }

    const diceRollRegex = /\[ROLL_D20:(.*?)\]/;
    const diceMatch = narrative.match(diceRollRegex);
    if (diceMatch && diceMatch[1]) {
      setDiceRollRequest({ reason: diceMatch[1].trim() });
    }
    
    setMessages(prev => [...prev, { role: Roles.MODEL, text: narrative, id: Date.now().toString() }]);
  };
  
  const handleExport = useCallback(() => {
    const formattedHistory = messages.map(msg => {
      const prefix = msg.role === Roles.USER ? "Você" : "Narrador";
      return `${prefix}:\n${msg.text.split('[ROLL_D20:')[0].trim()}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([formattedHistory], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `narrativa-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [messages]);

  const handleSaveAdventure = useCallback(async () => {
    console.log("Action limit reached. Preparing to save adventure to backend...");
    const payload = {
      adventureId: adventureMetaRef.current.id,
      startedAt: adventureMetaRef.current.startedAt,
      endedAt: new Date().toISOString(),
      messages: messages.filter(msg => msg.id !== 'start-prompt'), // Filtra a mensagem de boas-vindas aqui também
      storyLog: storyLog,
      fanficContext: fanficContext,
    };

    AdventureLogService.saveAdventure(payload)
      .then(response => {
        if (response.success) {
          console.log("Background save successful:", response.message);
        } else {
          console.error("Background save failed:", response.message);
        }
      });
    
    actionCountRef.current = 0;
  }, [messages, storyLog, fanficContext]);

  const sendMessage = useCallback(async (text: string) => {
    let userText = text;

    if (messages.length === 1 && messages[0].id === 'start-prompt' && !userText.trim()) {
      userText = "Use um personagem padrão: Um andarilho misterioso com um passado sombrio, vestindo um manto surrado que esconde feições cansadas. Habilidoso com uma lâmina curta e sobrevivência, busca por uma relíquia perdida para redimir um erro antigo. A aventura deve ser focada em exploração e mistério.";
    }

    const newUserMessage: Message = { role: Roles.USER, text: userText, id: Date.now().toString() };
    const currentHistory = [...messages, newUserMessage];
    setMessages(currentHistory);
    
    if (actionCountRef.current >= 5) {
        handleSaveAdventure();
    } else {
        actionCountRef.current += 1;
    }

    setIsLoading(true);
    
    // A LÓGICA CRUCIAL ESTÁ AQUI:
    // Filtramos o histórico para remover a mensagem de boas-vindas antes de enviar para a IA.
    const historyForApi = currentHistory.filter(msg => msg.id !== 'start-prompt');
    
    const responseText = await GeminiService.generateContent(
      historyForApi,
      storyLog,
      fanficContext
    );
    
    processApiResponse(responseText);
    setIsLoading(false);
  }, [messages, storyLog, fanficContext, handleSaveAdventure]);

  const handleContextSubmit = (context: string) => {
    setFanficContext(context || undefined);
    setGameStarted(true);
    adventureMetaRef.current = {
      id: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startedAt: new Date().toISOString(),
    };
    setMessages([{ 
        role: Roles.MODEL, 
        text: "Bem-vindo, aventureiro! Antes de começarmos, descreva seu personagem.\n\nQuem é você? Qual sua aparência, suas habilidades? E que tipo de história você gostaria de viver?\n\n(Se preferir, deixe em branco e eu criarei um personagem padrão para você começar.)", 
        id: 'start-prompt'
    }]);
  };
  
  const handleDiceRoll = (result: number) => {
    const resultText = `[Resultado do D20: ${result}]`;
    setDiceRollRequest(null);
    sendMessage(resultText);
  };

  const handleSaveGame = () => {
    if (!gameStarted) return;
    const saveState: SaveState = {
      messages,
      storyLog,
      fanficContext,
      gameStarted,
      actionCount: actionCountRef.current,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveState));
    alert("Jogo salvo com sucesso!");
    setSaveExists(true);
  };

  const handleLoadGame = () => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      const savedState: SaveState = JSON.parse(savedData);
      setMessages(savedState.messages);
      setStoryLog(savedState.storyLog);
      setFanficContext(savedState.fanficContext);
      setGameStarted(savedState.gameStarted);
      actionCountRef.current = savedState.actionCount;
      adventureMetaRef.current = {
        id: `adv_loaded_${Date.now()}`,
        startedAt: new Date().toISOString(),
      };
      alert("Jogo carregado com sucesso!");
    } else {
      alert("Nenhum jogo salvo encontrado.");
    }
  };

  return (
    <div className="h-screen w-screen bg-stone-100 flex flex-col font-sans">
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-stone-200 shadow-sm p-4 flex justify-between items-center z-10">
        <h1 className="text-xl md:text-2xl font-bold text-stone-800 font-serif">Narrador de Histórias AI</h1>
        <div className="flex items-center space-x-2">
            {/* Link para o Histórico, agora sem texto para ficar mais limpo */}
            <Link to="/historias" className="p-2 rounded-full hover:bg-stone-200 transition-colors" aria-label="Ver Histórico de Aventuras">
              <Icon name="book" className="w-6 h-6 text-stone-600" />
            </Link>
            <button 
                onClick={handleSaveGame}
                disabled={!gameStarted}
                className="p-2 rounded-full hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Salvar Jogo"
            >
                <Icon name="save" className="w-6 h-6 text-stone-600" />
            </button>
            <button 
                onClick={handleExport}
                disabled={messages.length === 0}
                className="p-2 rounded-full hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Exportar História"
            >
                <Icon name="download" className="w-6 h-6 text-stone-600" />
            </button>
            <button 
            onClick={() => setIsLogOpen(true)}
            className="p-2 rounded-full hover:bg-stone-200 transition-colors"
            aria-label="Abrir Diário da Aventura"
            >
            <Icon name="book" className="w-6 h-6 text-stone-600" />
            </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col">
        <div className="w-full max-w-4xl mx-auto flex-grow">
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="px-5 py-4 my-2 rounded-2xl shadow-sm bg-white text-stone-900 self-start rounded-bl-none max-w-2xl">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-stone-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-stone-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-stone-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
          )}
          {diceRollRequest && <DiceRoller reason={diceRollRequest.reason} onRoll={handleDiceRoll} />}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="flex-shrink-0">
        <div className="w-full max-w-4xl mx-auto">
            <UserInput 
                onSubmit={sendMessage} 
                onContextSubmit={handleContextSubmit}
                disabled={isLoading || !!diceRollRequest}
                gameStarted={gameStarted}
                saveExists={saveExists}
                onLoadGame={handleLoadGame}
            />
        </div>
      </footer>
      
      <StoryLog log={storyLog} isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
    </div>
  );
};

export default GamePage;