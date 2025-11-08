import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// As chaves são lidas das variáveis de ambiente (do .env local ou da Vercel)
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!; // A chave secreta

// Criamos a instância do cliente Supabase aqui
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Desestruturamos todas as propriedades que recebemos do frontend
    const { adventureId, startedAt, endedAt, messages, storyLog, fanficContext } = req.body;

    if (!adventureId) {
      return res.status(400).json({ message: 'Adventure ID is required' });
    }
    
    // Mapeamos os nomes em camelCase para os nomes em snake_case do banco.
    const { data, error } = await supabase
      .from('adventures')
      .upsert({
        adventure_id: adventureId,
        started_at: startedAt,
        ended_at: endedAt,
        messages: messages,
        story_log: storyLog,
        fanfic_context: fanficContext
      }, {
        onConflict: 'adventure_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, message: `Adventure ${adventureId} saved.`, data });

  } catch (e) {
    const error = e as Error;
    console.error('Internal server error:', error.message);
    return res.status(500).json({ success: false, message: 'An internal error occurred.' });
  }
}