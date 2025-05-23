const axios = require("axios");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function detalharEdital(idpncp) {
  try {
    const [cnpj, , sequencialAno] = idpncp.split("-");
    const [sequencial, ano] = sequencialAno.replace("/", "-").split("-");
    const url = `https://pncp.gov.br/api/consulta/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}`;

    await sleep(1000 + Math.random() * 2000);
    const resp = await axios.get(url);
    const data = resp.data;

    return {
      cnpj: cnpj,
      orgao: data.orgaoEntidade?.razaoSocial || "",
      local: data.unidadeOrgao?.municipioNome || "",
      unidadeCompradora: data.unidadeOrgao?.nomeUnidade || "",
      modalidade: data.modalidadeNome || "",
      tipo: data.tipoInstrumentoConvocatorioNome || "",
      modo_disputa: data.modoDisputaNome || "",
      registro_preco: data.srp ? "Sim" : "Não",
      fonte_orcamentaria: data.fontesOrcamentarias?.map(f => f.nome).join(", ") || "",
      data_divulgacao: data.dataPublicacaoPncp || "",
      situacao: data.situacaoCompraNome || "",
      data_inicio: data.dataAberturaProposta || "",
      data_fim: data.dataEncerramentoProposta || "",
      valor_total: data.valorTotalEstimado || "",
      objetoDetalhado: data.objetoCompra || "",
      fonte_sistema: data.usuarioNome || ""
    };
  } catch (e) {
    console.log("Erro em detalharEdital:", e.message);
    return null;
  }
}

async function coletarItensEdital(idpncp) {
  try {
    const [cnpj, , sequencialAno] = idpncp.split("-");
    const [sequencial, ano] = sequencialAno.replace("/", "-").split("-");
    const base = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpj}/compras/${ano}/${sequencial}`;

    const quantidadeURL = `${base}/itens/quantidade`;
    const respQtd = await axios.get(quantidadeURL);
    const total = respQtd.data || 0;
    if (!total) return [];

    const itensURL = `${base}/itens?pagina=1&tamanhoPagina=${total}`;
    const respItens = await axios.get(itensURL);
    return respItens.data || [];
  } catch (e) {
    console.log("Erro em coletarItensEdital:", e.message);
    return null;
  }
}

module.exports = { detalharEdital, coletarItensEdital };
