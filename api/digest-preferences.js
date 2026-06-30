import { supabase } from '../lib/supabase.js';

// POST /api/digest-preferences
// Body: { email, name, enabled, send_time, channel, keywords, uf }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const { email, name, enabled, send_time, channel, keywords, uf, whatsapp_number } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'Campo "email" é obrigatório.' });
  }

  try {
    const { data, error } = await supabase
      .from('digest_preferences')
      .upsert(
        {
          user_email: email,
          user_name: name || null,
          enabled: enabled ?? true,
          send_time: send_time || '08:00',
          channel: channel || 'email',
          keywords: keywords || null,
          uf: uf || null,
          whatsapp_number: whatsapp_number || null,
        },
        { onConflict: 'user_email' }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, preferences: data });
  } catch (err) {
    console.error('[digest-preferences] erro:', err);
    return res.status(500).json({ error: 'Erro ao salvar preferências.', details: err.message });
  }
}
