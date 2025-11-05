// src/pages/AdventureDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // useParams é o gancho para ler parâmetros da URL
import { createClient } from '@supabase/supabase-js';

// Reutilizamos o cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Definimos a forma completa de uma aventura, incluindo as mensagens
interface AdventureDetails {
  id: string;
  created_at: string;
  fanfic_context: string | null;
  messages: Array<{ role: string; text: string }>; // O histórico da conversa
}

const AdventureDetailPage: React.FC = () => {
  // useParams() nos dá um objeto com os parâmetros da URL.
  // Como nossa rota é /historias/:adventureId, o objeto será { adventureId: 'o-valor-do-id' }
  const { adventureId } = useParams<{ adventureId: string }>();

  const [adventure, setAdventure] = useState<AdventureDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdventureDetails = async () => {
      if (!adventureId) return; // Não faz nada se o ID não estiver presente

      setIsLoading(true);
      setError(null);

      // Nova consulta ao Supabase: buscar UMA ÚNICA aventura.
      const { data, error } = await supabase
        .from('adventures')
        .select('*')
        .eq('adventure_id', adventureId) // .eq() significa "equals". Busca onde adventure_id é IGUAL ao ID da URL.
        .single(); // .single() nos diz para esperar apenas um resultado.

      if (error) {
        console.error('Error fetching adventure details:', error);
        setError('Não foi possível carregar os detalhes desta aventura.');
      } else {
        setAdventure(data);
      }
      setIsLoading(false);
    };

    fetchAdventureDetails();
  }, [adventureId]); // O useEffect vai rodar de novo se o adventureId na URL mudar.

  if (isLoading) {
    return <div className="p-8 text-center">Carregando aventura...</div>;
  }

  if (error || !adventure) {
    return <div className="p-8 text-center text-red-500">{error || 'Aventura não encontrada.'}</div>;
  }

  return (
    <div className="bg-stone-100 min-h-screen font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <Link to="/historias" className="text-amber-600 hover:underline">&larr; Voltar para o Arquivo</Link>
        </header>

        <h1 className="text-3xl font-bold font-serif text-stone-800 mb-4">
          Aventura de {new Date(adventure.created_at).toLocaleDateString('pt-BR')}
        </h1>
        {adventure.fanfic_context && (
          <blockquote className="border-l-4 border-amber-300 pl-4 italic text-stone-600 mb-6">
            <strong>Contexto inicial:</strong> {adventure.fanfic_context}
          </blockquote>
        )}

        <div className="space-y-4">
          {adventure.messages.map((msg, index) => (
            <div key={index} className={`p-4 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-amber-100' : 'bg-white'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdventureDetailPage;