
import React, { useState } from 'react';
import { Icon } from './Icons';

interface DiceRollerProps {
  reason: string;
  onRoll: (result: number) => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ reason, onRoll }) => {
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    setIsRolling(true);
    setResult(null);

    const roll = Math.floor(Math.random() * 20) + 1;
    
    setTimeout(() => {
      setResult(roll);
      setIsRolling(false);
      setTimeout(() => onRoll(roll), 1500);
    }, 1000);
  };

  return (
    <div className="my-4 p-4 border-2 border-dashed border-amber-400 bg-amber-50 rounded-lg flex flex-col items-center text-center shadow-inner">
      <h3 className="text-stone-700 font-bold text-lg mb-2">Rolagem de Dados Necessária!</h3>
      <p className="text-stone-600 mb-4 font-serif italic">"{reason}"</p>
      
      {result !== null ? (
         <div className="flex items-center justify-center bg-white border border-stone-300 rounded-lg p-4 w-40 h-24 shadow-md">
            <p className="text-5xl font-bold text-amber-700">{result}</p>
         </div>
      ) : (
        <button
          onClick={handleRoll}
          disabled={isRolling}
          className="flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-bold rounded-lg shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 transition-transform duration-150 ease-in-out hover:scale-105 disabled:bg-stone-400 disabled:cursor-not-allowed"
        >
          {isRolling ? (
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <>
              <Icon name="dice" className="mr-2" />
              Rolar D20
            </>
          )}
        </button>
      )}
    </div>
  );
};
