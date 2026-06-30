const PNCP_BASE = 'https://pncp.gov.br/api/consulta/v1';

function pad(n) { return String(n).padStart(2, '0'); }

function dataHojeFormatada() {
  const hoje = new Date();
  return `${hoje.getFullYear()}${pad(hoje.getMonth() + 1)}${pad(hoje.getDate())}`;
}

function dataInicioMesFormatada() {
  const hoje = new Date();
  return `${hoje.getFullYear()}${pad(hoje.getMonth() + 1)}01`;
}

/**
 * Busca licitações publicadas no PNCP no período corrente,
 * filtrando por palavras-chave se fornecidas.
 */
export async function buscarLicitacoes({ keywords = '', uf = '' } = {}) {
  const dataFim = dataHojeFormatada();
  const dataIni = dataInicioMesFormatada();

  const url = `${PNCP_BASE}/contratacoes/publicacao?dataInicial=${dataIni}&dataFinal=${dataFim}&pagina=1&tamanhoPagina=50`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro PNCP: ${res.status}`);
  const data = await res.json();
  let items = data.data || data.content || [];

  if (uf) {
    items = items.filter(i => (i.siglaUf || i.ufNome || '').toUpperCase().includes(uf.toUpperCase()));
  }

  if (keywords) {
    const terms = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (terms.length) {
      items = items.filter(i => {
        const texto = `${i.objetoCompra || ''} ${i.nomeOrgao || ''}`.toLowerCase();
        return terms.some(t => texto.includes(t));
      });
    }
  }

  // Prioriza as que encerram em breve / publicadas mais recentemente
  return items.slice(0, 10);
}

export function fmtMoeda(v) {
  if (!v) return 'valor não informado';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
