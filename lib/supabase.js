import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente — configure no painel da Vercel (Settings > Environment Variables)
// SUPABASE_URL: encontrado em Project Settings > API > Project URL
// SUPABASE_SERVICE_KEY: encontrado em Project Settings > API > service_role key (NUNCA exponha no front)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] Variáveis de ambiente SUPABASE_URL / SUPABASE_SERVICE_KEY não configuradas.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
