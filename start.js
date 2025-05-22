// start.js - scraping HTTP via API PNCP (sem Puppeteer)
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("PNCP bot ativo"));
app.listen(process.env.PORT || 3000);

const {
  PAGINAS_SORTEADAS,
  LIMITE_EDITAIS_POR_EXECUCAO,
  DELAY_ENTRE_EDITAIS_MS,
  DELAY_EM_CASO_DE_ERRO_MS,
} = require("./config");
const { salvarEdital } = require("./db");
const { detalharEdital } = require("./detalhar");
const { sleep, notificarTelegram } = require("./utils");

(async () => {
  await notificarTelegram("🤖 Bot PNCP iniciado (modo API).");
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

      console.log(`[API] Buscando página ${pagina} via API...`);
      console.log("[DEBUG] Params:", params);

      const response = await axios.get(baseUrl, {
        params,
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 PNCPBot",
          "Accept": "application/json"
        }
      });

      console.log(`[DEBUG] Total de itens recebidos: ${response.data?.items?.length || 0}`);
      console.log("[DEBUG] Primeiro item:", response.data?.items?.[0]);

      const rawItems = response.data?.items || [];
      const licitacoes = Array.isArray(rawItems) ? rawItems : Object.values(rawItems);
      if (licitacoes.length === 0) break;

      for (const item of licitacoes) {
        if (totalColetado >= LIMITE_EDITAIS_POR_EXECUCAO) break;

        const idpncp = item.numero_controle_pncp;
        const titulo = item.description || item.title || "Sem título";
        const link = item.item_url ? `https://pncp.gov.br${item.item_url}` : null;

        const detalhes = await detalharEdital(idpncp);
        console.log("[DEBUG] Detalhes do edital:", detalhes);
        if (!detalhes) {
          await notificarTelegram(`⚠️ Falha ao detalhar edital ${idpncp}. Pausando.`);
          await sleep(DELAY_EM_CASO_DE_ERRO_MS);
          continue;
        }

        console.log("[DB] Salvando edital:", idpncp);
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

        console.log(`[coleta] Salvo ${idpncp}`);
        totalColetado++;
        await sleep(DELAY_ENTRE_EDITAIS_MS());
      }

      pagina++;
    }

    await notificarTelegram(`✅ Coleta via API finalizada. ${totalColetado} editais salvos.`);
    console.log("✅ Script finalizado");
  } catch (err) {
    console.error("Erro geral:", err);
    await notificarTelegram(`❌ Erro geral na coleta via API: ${err.message}`);
  }
})();
