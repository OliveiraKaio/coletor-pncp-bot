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
const { salvarEdital, editalExiste } = require("./db");
const { detalharEdital } = require("./detalhar");
const { sleep, notificarTelegram } = require("./utils");

// Aleatoriedade: chance de executar o script (ex: 50%)
const chanceBase = 0.6 + Math.random() * 0.3; // entre 0.6 e 0.9
if (Math.random() > chanceBase) {
  console.log("⏸️ Execução ignorada (simulando comportamento humano).\n");
  process.exit(0);
}


(async () => {
  await notificarTelegram("🤖 Bot PNCP iniciou nova varredura (cron).");
  const baseUrl = "https://pncp.gov.br/api/search/";
  let pagina = 1;
  let totalColetado = 0;

  try {
    while (totalColetado < LIMITE_EDITAIS_POR_EXECUCAO) {
      const params = {
        tipos_documento: "edital",
        ordenacao: "-data",
        pagina,
        tam_pagina: 10,
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
      if (licitacoes.length === 0) break;

      let capturadosNestaPagina = 0;

      for (const item of licitacoes) {
        if (totalColetado >= LIMITE_EDITAIS_POR_EXECUCAO) break;

        const idpncp = item.numero_controle_pncp;
        const titulo = item.description || item.title || "Sem título";
        const link = item.item_url ? `https://pncp.gov.br${item.item_url}` : null;

        const jaExiste = await editalExiste(idpncp);
        if (jaExiste) {
          console.log(`⏩ Edital ${idpncp} já coletado. Pulando.`);
          continue;
        }

        console.log(`🔍 Detalhando edital ${idpncp}...`);
        const detalhes = await detalharEdital(idpncp);
        if (!detalhes) {
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
        });

        console.log(`✅ Edital salvo: ${idpncp}`);
        totalColetado++;
        capturadosNestaPagina++;
        await sleep(1500 + Math.random() * 3000);
      }

      if (capturadosNestaPagina === 0) {
        console.log("📭 Nenhum edital novo nesta página.");
      }

      pagina++;
      console.log("⏳ Aguardando próxima página...");
      await sleep(2000 + Math.random() * 2000);
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
