const express = require("express");
const app = express();

app.get("/", (_, res) => res.send("🤖 Bot PNCP ativo."));

const PORT = 3000;
app
  .listen(PORT, () => {
    console.log(`Servidor HTTP ativo na porta ${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️ Porta ${PORT} já em uso. Ignorando...`);
    } else {
      throw err;
    }
  });
