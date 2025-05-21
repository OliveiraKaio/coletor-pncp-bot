module.exports = {
  LIMITE_EDITAIS_POR_EXECUCAO: Math.floor(Math.random() * 6) + 10, // entre 10 e 15 editais
  PAGINAS_SORTEADAS: () => {
    const paginas = new Set();
    const total = Math.floor(Math.random() * 3) + 2; // entre 2 e 4 páginas
    while (paginas.size < total) {
      paginas.add(Math.floor(Math.random() * 20) + 1); // páginas 1 a 20
    }
    return Array.from(paginas);
  },
  DELAY_ENTRE_EDITAIS_MS: () => Math.floor(Math.random() * 3000) + 2000, // entre 2s e 5s
  DELAY_EM_CASO_DE_ERRO_MS: 300000, // 5 minutos
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL
};
