const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function notificarTelegram(token, chatId, msg) {
  if (!token || !chatId) return;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg })
    });
  } catch (e) {
    console.warn('[telegram] falha ao enviar:', e.message);
  }
}

module.exports = { notificarTelegram };
