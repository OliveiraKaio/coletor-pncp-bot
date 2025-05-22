const express = require("express");
const app = express();
const { executarColeta } = require("./start");

app.get("/", (_, res) => res.send("🤖 Bot PNCP ativo."));

app.get("/start", async (_, res) => {
  try {
    await executarColeta();
    res.send("✅ Coleta executada com sucesso.");
  } catch (err) {
    console.error("Erro ao executar coleta:", err);
    res.status(500).send("❌ Erro ao executar coleta.");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Servidor HTTP ativo na porta ${PORT}`);
});
