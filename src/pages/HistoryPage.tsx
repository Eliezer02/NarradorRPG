import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

// ====================================================================================
// MUDANÇA 1: Atualizamos a "planta" (interface) para incluir a propriedade 'adventure_id'.
// Agora o TypeScript sabe que essa propriedade existe em nossos objetos de aventura.
// ====================================================================================
interface Adventure {
  id: string;
  created_at: string;
  fanfic_context: string | null;
  adventure_id: string; // <-- Adicionada esta linha
}

// Configuração do Cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined. Check your .env file.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const HistoryPage: React.FC = () => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdventures = async () => {
      setIsLoading(true);
      setError(null);

      // ====================================================================================
      // MUDANÇA 2: Atualizamos o pedido ao banco de dados para incluir a coluna 'adventure_id'.
      // Agora os dados que recebemos do Supabase correspondem à nossa interface.
      // ====================================================================================
      const { data, error } = await supabase
        .from('adventures')
        .select('id, created_at, fanfic_context, adventure_id') // <-- Coluna adicionada aqui
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching adventures:', error);
        setError('Não foi possível carregar as aventuras. Verifique o console para mais detalhes.');
      } else {
        setAdventures(data || []);
      }
      setIsLoading(false);
    };

    fetchAdventures();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-stone-100">
        <div className="text-xl text-stone-600">Carregando histórias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-stone-100">
        <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-stone-100 min-h-screen font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800 font-serif border-b-2 border-amber-200 pb-3">
            Arquivo de Aventuras
          </h1>
          <Link to="/" className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-transform hover:scale-105">
            Jogar
          </Link>
        </header>

        {adventures.length === 0 ? (
          <p className="text-center text-stone-500 mt-12">Nenhuma aventura foi encontrada no arquivo.</p>
        ) : (
          <ul className="space-y-4">
            {adventures.map((adv) => (
              <li key={adv.id} className="bg-white p-6 rounded-lg shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-bold font-serif text-amber-800">
                  Aventura de {new Date(adv.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </h2>
                {adv.fanfic_context ? (
                  <p className="mt-2 text-stone-600 italic">
                    <strong>Contexto:</strong> {adv.fanfic_context.substring(0, 200)}...
                  </p>
                ) : (
                  <p className="mt-2 text-stone-500 italic">
                    Aventura iniciada sem contexto adicional.
                  </p>
                )}
                {/* Agora este link funciona, pois `adv.adventure_id` existe e é reconhecido pelo TypeScript */}
                <Link to={`/historias/${adv.adventure_id}`} className="text-amber-600 hover:underline mt-4 inline-block">Ler história completa</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;