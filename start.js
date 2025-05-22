const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const {
  LIMITE_EDITAIS_POR_EXECUCAO,
  DELAY_ENTRE_EDITAIS_MS,
  DELAY_EM_CASO_DE_ERRO_MS,
} = require("./config");
const {
  salvarEdital,
  editalExiste,
  inicializarBanco,
  consultarIdsExistentes,
  getContadorExecucoes,
  setContadorExecucoes,
} = require("./db");
const { detalharEdital, coletarItensEdital } = require("./detalhar");
const { sleep, notificarTelegram } = require("./utils");

async function executarColeta() {
  await inicializarBanco();
  let contadorExecucoes = await getContadorExecucoes();

  const chanceBase = 0.5;
  const chanceExtra = contadorExecucoes * 0.2;
  const chanceFinal = Math.min(1, chanceBase + chanceExtra);
  const sorteio = Math.random();
  const deveExecutar = sorteio < chanceFinal;
  const agora = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });

  if (!deveExecutar && contadorExecucoes < 3) {
    contadorExecucoes++;
    await setContadorExecucoes(contadorExecucoes);
    console.log(`⏸️ Execução ignorada (${(chanceFinal * 100).toFixed(1)}% de chance, sorteio ${(sorteio * 100).toFixed(1)}%) — ${agora}`);
    return;
  } else {
    contadorExecucoes = 0;
    await setContadorExecucoes(0);
    console.log(`✅ Execução permitida (${(chanceFinal * 100).toFixed(1)}% de chance, sorteio ${(sorteio * 100).toFixed(1)}%) — ${agora}`);
  }

  await notificarTelegram("🤖 Bot PNCP iniciou nova varredura (cron).\nPágina inicial: 1");

  const baseUrl = "https://pncp.gov.br/api/search/";
  let totalColetado = 0;
  let pagina = 1;

  try {
    while (totalColetado < LIMITE_EDITAIS_POR_EXECUCAO) {
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
        break;
      }

      const ids = licitacoes.map(item => item.numero_controle_pncp);
      const jaColetados = await consultarIdsExistentes(ids);
      if (jaColetados.length === ids.length) {
        console.log(`⚡ Página ${pagina} já totalmente varrida. Pulando...`);
        pagina++;
        continue;
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
          await notificarTelegram(`❌ Falha ao detalhar edital ${idpncp} — possível erro de conexão ou bloqueio.`);
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

      pagina++;
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
}

module.exports = { executarColeta };
