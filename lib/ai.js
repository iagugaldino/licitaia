/**
 * Gera um resumo em português das licitações do dia, usando a API da Anthropic.
 * Requer ANTHROPIC_API_KEY configurada nas variáveis de ambiente da Vercel.
 */
export async function gerarResumoIA(licitacoes, { keywords } = {}) {
  if (!licitacoes.length) {
    return 'Nenhuma licitação nova encontrada hoje para os filtros configurados.';
  }

  const lista = licitacoes
    .map((l, i) => `${i + 1}. ${l.objetoCompra || 'Objeto não informado'} — Órgão: ${l.nomeOrgao || '—'} — Valor: ${l.valorTotalEstimado ? 'R$ ' + Number(l.valorTotalEstimado).toLocaleString('pt-BR') : 'não informado'}`)
    .join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system: 'Você escreve resumos diários de licitações públicas para donos de PME no Brasil. Tom direto, prático, sem enrolação. Use bullet points simples com "-". Não use markdown de cabeçalho.',
      messages: [
        {
          role: 'user',
          content: `Filtro do usuário: "${keywords || 'sem filtro específico'}"\n\nLicitações encontradas hoje:\n${lista}\n\nEscreva um resumo diário curto (máx 150 palavras) destacando as 3 oportunidades mais relevantes e por quê. Termine com uma frase de incentivo a abrir o painel para ver os detalhes.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro Anthropic API: ${res.status} — ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'Não foi possível gerar o resumo hoje.';
}
