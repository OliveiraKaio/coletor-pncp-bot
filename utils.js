const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

async function notificarTelegram(mensagem) {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: mensagem,
      parse_mode: "HTML"
    });
  } catch (err) {
    console.error("Erro ao enviar para Telegram:", err.message);
  }
}

module.exports = { notificarTelegram };
