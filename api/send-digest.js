import { supabase } from '../lib/supabase.js';
import { buscarLicitacoes } from '../lib/pncp.js';
import { gerarResumoIA } from '../lib/ai.js';
import { enviarEmailDigest } from '../lib/email.js';

// GET /api/send-digest
// Disparado pelo Vercel Cron (configurado em vercel.json) de hora em hora.
// Em cada execução, verifica quem deveria receber o digest nessa janela de horário
// e ainda não recebeu hoje, processa e envia.
export default async function handler(req, res) {
  // Proteção simples: só aceita chamadas do próprio Vercel Cron ou com o secret correto
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const agora = new Date();
  // Horário de Brasília (UTC-3) — ajuste se a Vercel rodar em outro fuso
  const horaBrasilia = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const horaAtual = `${String(horaBrasilia.getHours()).padStart(2, '0')}:00`;
  const hojeISO = horaBrasilia.toISOString().slice(0, 10);

  try {
    // Busca quem está habilitado, no horário certo, e ainda não recebeu hoje
    const { data: usuarios, error } = await supabase
      .from('digest_preferences')
      .select('*')
      .eq('enabled', true)
      .eq('send_time', horaAtual)
      .eq('channel', 'email'); // WhatsApp ainda não ativo — fica de fora por enquanto

    if (error) throw error;

    if (!usuarios || !usuarios.length) {
      return res.status(200).json({ success: true, message: 'Nenhum usuário para processar nesse horário.', horaAtual });
    }

    const resultados = [];

    for (const usuario of usuarios) {
      // Evita reenviar se já mandou hoje (proteção contra cron duplicado)
      if (usuario.last_sent_at && usuario.last_sent_at.slice(0, 10) === hojeISO) {
        resultados.push({ email: usuario.user_email, status: 'já enviado hoje' });
        continue;
      }

      try {
        const licitacoes = await buscarLicitacoes({ keywords: usuario.keywords, uf: usuario.uf });
        const resumoIA = await gerarResumoIA(licitacoes, { keywords: usuario.keywords });

        await enviarEmailDigest({
          to: usuario.user_email,
          nome: usuario.user_name,
          resumoIA,
          totalLicitacoes: licitacoes.length,
          linkPainel: process.env.PAINEL_URL || 'https://licitaia.vercel.app',
        });

        await supabase
          .from('digest_preferences')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', usuario.id);

        resultados.push({ email: usuario.user_email, status: 'enviado', total: licitacoes.length });
      } catch (errUsuario) {
        console.error(`[send-digest] erro pro usuário ${usuario.user_email}:`, errUsuario);
        resultados.push({ email: usuario.user_email, status: 'erro', detalhe: errUsuario.message });
      }
    }

    return res.status(200).json({ success: true, horaAtual, processados: resultados.length, resultados });
  } catch (err) {
    console.error('[send-digest] erro geral:', err);
    return res.status(500).json({ error: 'Erro ao processar digest.', details: err.message });
  }
}
