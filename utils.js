const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID } = require('./config');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function notificarTelegram(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg })
    });
  } catch (e) {
    console.warn('[telegram] falha ao enviar:', e.message);
  }
}

module.exports = { sleep, notificarTelegram };
