// index.js
const express = require("express");
const app = express();
const { executarColeta } = require("./start");

app.get("/", (_, res) => res.send("🤖 Bot PNCP ativo."));

app.get("/start", async (req, res) => {
  res.send("✅ Coleta foi iniciada.");
  try {
    await executarColeta();
  } catch (err) {
    console.error("Erro ao executar coleta:", err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor HTTP ativo na porta ${PORT}`);
});
