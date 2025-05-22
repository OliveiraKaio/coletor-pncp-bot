const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function notificarTelegram(token, chatId, msg) {
  if (!token || !chatId || !msg) {
    console.warn('[telegram] Token, chatId ou mensagem ausente.');
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'HTML'
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[telegram] Falha HTTP ${res.status}: ${errorText}`);
    }
  } catch (e) {
    console.warn('[telegram] Falha na requisição:', e.message);
  }
}

module.exports = { notificarTelegram };
