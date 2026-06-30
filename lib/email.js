/**
 * Envia o e-mail de resumo diário usando Resend (https://resend.com).
 * Por quê Resend: setup mais rápido que SMTP tradicional, tem free tier (100 e-mails/dia),
 * e funciona bem em ambiente serverless (Vercel). Se preferir outro provedor (SendGrid, Postmark),
 * troque só essa função — o resto do sistema não muda.
 *
 * Requer RESEND_API_KEY nas variáveis de ambiente da Vercel.
 * Requer um domínio verificado no Resend (ou use onboarding@resend.dev pra testar antes de configurar domínio próprio).
 */
export async function enviarEmailDigest({ to, nome, resumoIA, totalLicitacoes, linkPainel }) {
  const html = `
  <div style="font-family: -apple-system, Inter, sans-serif; max-width: 560px; margin: 0 auto; background: #0D0F14; color: #E8EAF0; padding: 32px 24px; border-radius: 16px;">
    <div style="display:flex; align-items:center; gap:8px; margin-bottom: 24px;">
      <div style="width:32px;height:32px;background:#4F6EF7;border-radius:8px;display:inline-block;text-align:center;line-height:32px;">⚡</div>
      <span style="font-size:18px; font-weight:700; vertical-align:middle; margin-left:8px;">Licita<span style="color:#6B87FF">IA</span></span>
    </div>

    <h1 style="font-size:18px; margin-bottom:4px;">Bom dia${nome ? ', ' + nome : ''} 👋</h1>
    <p style="color:#9CA3AF; font-size:13px; margin-bottom:24px;">
      Encontramos <strong style="color:#E8EAF0;">${totalLicitacoes} licitações</strong> relevantes hoje pro seu perfil.
    </p>

    <div style="background: rgba(79,110,247,0.08); border: 1px solid rgba(79,110,247,0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px; white-space: pre-line; font-size: 14px; line-height: 1.7; color: #C5C9D6;">
      ${resumoIA.replace(/\n/g, '<br>')}
    </div>

    <a href="${linkPainel}" style="display:inline-block; background:#4F6EF7; color:#fff; text-decoration:none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
      Ver todas no painel →
    </a>

    <p style="color:#6B7280; font-size:11px; margin-top:32px; border-top: 1px solid #232840; padding-top:16px;">
      Você está recebendo este e-mail porque ativou o resumo diário no LicitaIA.
      Para ajustar horário ou desativar, acesse Configurações no painel.
    </p>
  </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'LicitaIA <onboarding@resend.dev>',
      to: [to],
      subject: `📋 ${totalLicitacoes} licitações relevantes pra você hoje`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro Resend: ${res.status} — ${errText}`);
  }

  return res.json();
}
