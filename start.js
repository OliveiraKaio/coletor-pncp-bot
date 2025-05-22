// start.js - scraping HTTP via API PNCP (sem Puppeteer)
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const {
  PAGINAS_SORTEADAS,
  LIMITE_EDITAIS_POR_EXECUCAO,
  DELAY_ENTRE_EDITAIS_MS,
  DELAY_EM_CASO_DE_ERRO_MS,
} = require("./config");
const { salvarEdital, editalExiste, inicializarBanco, consultarIdsExistentes } = require("./db");
const { detalharEdital, coletarItensEdital } = require("./detalhar");
const { sleep, notificarTelegram } = require("./utils");

// Aleatoriedade com base no horário do dia
const horaAtual = new Date().getHours();
const chanceDeExecutar = horaAtual >= 6 && horaAtual <= 23 ? 0.7 : 1.0;
if (Math.random() > chanceDeExecutar) {
  console.log(`⏸️ Execução ignorada (${(1 - chanceDeExecutar) * 100}% de chance) — ${new Date().toLocaleTimeString()}`);
  process.exit(0);
}

(async () => {
  await notificarTelegram("🤖 Bot PNCP iniciou nova varredura (cron).");
  await inicializarBanco();

  const baseUrl = "https://pncp.gov.br/api/search/";
  let totalColetado = 0;

  // Sorteio de página com base no horário do dia
  const hora = new Date().getHours();
  const dia = new Date().getDay();
  const pagina = dia === 0 || dia === 6
    ? Math.floor(Math.random() * 900) + 100 // Fim de semana: buscar editais antigos
    : Math.floor(Math.random() * 100) + 1; // Semana: buscar recentes

  try {
    const params = {
      tipos_documento: "edital",
      ordenacao: "-data",
      pagina,
      tam_pagina: 100,
      status: "recebendo_proposta",
    };

    console.log(`📥 Página ${pagina} — consultando API do PNCP...`);
    const response = await axios.get(baseUrl, {
      params,
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 PNCPBot",
        "Accept": "application/json"
      }
    });

    const rawItems = response.data?.items || [];
    const licitacoes = Array.isArray(rawItems) ? rawItems : Object.values(rawItems);
    if (licitacoes.length === 0) {
      console.log("📭 Nenhum edital retornado.");
      return;
    }

    const ids = licitacoes.map(item => item.numero_controle_pncp);
    const jaColetados = await consultarIdsExistentes(ids);
    if (jaColetados.length === ids.length) {
      console.log(`⚡ Página ${pagina} já totalmente varrida. Pulando...`);
      return;
    }

    for (const item of licitacoes) {
      if (totalColetado >= LIMITE_EDITAIS_POR_EXECUCAO) break;

      const idpncp = item.numero_controle_pncp;
      const titulo = item.description || item.title || "Sem título";
      const link = item.item_url ? `https://pncp.gov.br${item.item_url}` : null;

      if (jaColetados.includes(idpncp)) {
        console.log(`⏩ Edital ${idpncp} já coletado. Pulando.`);
        continue;
      }

      console.log(`🔍 Detalhando edital ${idpncp}...`);
      const detalhes = await detalharEdital(idpncp);
      const itensDetalhados = await coletarItensEdital(idpncp);

      if (!detalhes || !itensDetalhados) {
        console.log(`⚠️ Falha ao detalhar ${idpncp}`);
        await sleep(DELAY_EM_CASO_DE_ERRO_MS);
        continue;
      }

      await salvarEdital({
        idpncp,
        titulo,
        modalidade: detalhes.modalidade,
        ultima_atualizacao: detalhes.data_divulgacao,
        orgao: detalhes.orgao,
        local: detalhes.local,
        objeto: detalhes.objetoDetalhado,
        link,
        ...detalhes,
        itens_detalhados: JSON.stringify(itensDetalhados)
      });

      console.log(`✅ Edital salvo: ${idpncp}`);
      totalColetado++;
      await sleep(1500 + Math.random() * 3000);
    }

    if (totalColetado > 0) {
      await notificarTelegram(`📦 Coleta finalizada. ${totalColetado} editais salvos.`);
    } else {
      await notificarTelegram("📭 Nenhum edital novo encontrado.");
    }

    console.log("✅ Script finalizado");
  } catch (err) {
    console.error("Erro geral:", err);
    await notificarTelegram(`❌ Erro geral: ${err.message}`);
  }
})();
