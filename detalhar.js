const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { sleep } = require('./utils');

async function detalharEdital(idpncp) {
  try {
    await sleep(1000 + Math.random() * 2000);
    const resp = await fetch(`https://pncp.gov.br/api/edital/${idpncp}`);
    if (!resp.ok) return null;

    const data = await resp.json();
    return {
      cnpj: data.cnpj || "",
      orgao: data.orgao || "",
      local: data.municipio || "",
      unidadeCompradora: data.unidade_compradora?.nome || "",
      modalidade: data.modalidade || "",
      tipo: data.tipo_licitacao || "",
      modo_disputa: data.modo_disputa || "",
      registro_preco: data.registro_preco || "",
      fonte_orcamentaria: data.fonte_recurso || "",
      data_divulgacao: data.data_publicacao || "",
      situacao: data.situacao || "",
      data_inicio: data.data_inicio_recebimento_proposta || "",
      data_fim: data.data_fim_recebimento_proposta || "",
      valor_total: data.valor_estimado || "",
      objetoDetalhado: data.objeto_completo || "",
      itens: JSON.stringify(data.itens || [])
    };
  } catch (e) {
    return null;
  }
}

module.exports = { detalharEdital };
