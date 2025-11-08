import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// As chaves são lidas das variáveis de ambiente (do .env local ou da Vercel)
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!; // A chave secreta

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { adventureId, ...adventureData } = req.body;

    if (!adventureId) {
      return res.status(400).json({ message: 'Adventure ID is required' });
    }
    
    // O 'upsert' tenta atualizar se já existir, ou criar se for novo.
    const { data, error } = await supabase
      .from('adventures')
      .upsert({
        adventure_id: adventureId,
        ...adventureData
      }, {
        onConflict: 'adventure_id' // A coluna que define um conflito (chave única)
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