// start.js
const puppeteer = require('puppeteer');
const { PAGINAS_SORTEADAS, LIMITE_EDITAIS_POR_EXECUCAO, DELAY_ENTRE_EDITAIS_MS, DELAY_EM_CASO_DE_ERRO_MS } = require('./config');
const { salvarEdital } = require('./db');
const { detalharEdital } = require('./detalhar');
const { sleep, notificarTelegram } = require('./utils');

(async () => {
  await notificarTelegram('🤖 Bot PNCP iniciado.');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let totalColetado = 0;

  try {
    const paginas = PAGINAS_SORTEADAS();
    for (const pagina of paginas) {
      if (totalColetado >= LIMITE_EDITAIS_POR_EXECUCAO) break;

      const url = `https://pncp.gov.br/app/editais?pagina=${pagina}`;
      console.log(`[pagina] Acessando ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(2000 + Math.random() * 1000);

      const blocos = await page.$$('div.col-12.col-md');
      console.log(`[pagina ${pagina}] blocos encontrados: ${blocos.length}`);

      for (const bloco of blocos) {
        if (totalColetado >= LIMITE_EDITAIS_POR_EXECUCAO) break;
        const texto = await page.evaluate(el => el.innerText, bloco);

        if (!texto.includes('Id contratação PNCP:')) continue;

        const idpncp = texto.split('Id contratação PNCP:')[1].split('\n')[0].trim();
        const titulo = await bloco.$eval('strong', el => el.innerText);
        const link = `https://pncp.gov.br/app/#/edital/${idpncp}`;

        const detalhes = await detalharEdital(idpncp);
        if (!detalhes) {
          await notificarTelegram(`⚠️ Falha ao detalhar edital ${idpncp}. Pausando.`);
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
          ...detalhes
        });

        console.log(`[coleta] Salvo ${idpncp}`);
        totalColetado++;
        await sleep(DELAY_ENTRE_EDITAIS_MS());
      }
    }

    await notificarTelegram(`✅ Coleta finalizada. ${totalColetado} editais salvos.`);
  } catch (err) {
    console.error('Erro geral:', err);
    await notificarTelegram(`❌ Erro geral na coleta: ${err.message}`);
  }

  await browser.close();
})();
