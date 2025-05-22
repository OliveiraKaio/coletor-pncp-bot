const fetch = require("node-fetch");
const { sleep } = require("./utils");

async function detalharEdital(idpncp) {
  try {
    await sleep(1000 + Math.random() * 2000);

    const [cnpj, , resto] = idpncp.split("-");
    const [sequencial, ano] = resto.split("/");

    const url = `https://pncp.gov.br/api/consulta/v1/orgaos/${cnpj}/compras/${ano}/${parseInt(sequencial)}`;
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: {
        "User-Agent": "Mozilla/5.0 PNCPBot",
        "Accept": "application/json"
      }
    });

    if (!resp.ok) {
      console.error("[ERRO DETALHAR] Status:", resp.status);
      return null;
    }

    const data = await resp.json();

    return {
      cnpj,
      orgao: data.orgaoEntidade?.razaoSocial || "",
      local: data.unidadeOrgao?.municipioNome || "",
      unidadeCompradora: data.unidadeOrgao?.nomeUnidade || "",
      modalidade: data.modalidadeNome || "",
      tipo: data.tipoInstrumentoConvocatorioNome || "",
      modo_disputa: data.modoDisputaNome || "",
      registro_preco: data.srp ? "Sim" : "Não",
      fonte_orcamentaria: data.fontesOrcamentarias?.join(", ") || "",
      data_divulgacao: data.dataPublicacaoPncp || "",
      situacao: data.situacaoCompraNome || "",
      data_inicio: data.dataAberturaProposta || "",
      data_fim: data.dataEncerramentoProposta || "",
      valor_total: data.valorTotalEstimado || "",
      objetoDetalhado: data.objetoCompra || "",
      itens: "[]"
    };
  } catch (e) {
    console.error("Erro em detalharEdital:", e);
    return null;
  }
}

module.exports = { detalharEdital };