const { Pool } = require("pg");
const { DATABASE_URL } = require("./config");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inicializarBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS editais_completo (
      idpncp TEXT PRIMARY KEY,
      titulo TEXT, modalidade TEXT, ultima_atualizacao TEXT,
      orgao TEXT, local TEXT, objeto TEXT, link TEXT,
      cnpj TEXT, tipo TEXT, modo_disputa TEXT, registro_preco TEXT,
      fonte_orcamentaria TEXT, data_divulgacao TEXT, situacao TEXT,
      data_inicio TEXT, data_fim TEXT, valor_total TEXT,
      itens_detalhados TEXT, fonte_sistema TEXT,
      coletado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS execucoes_bot (
      id SERIAL PRIMARY KEY,
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      contador INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS editais_erros (
      idpncp TEXT PRIMARY KEY,
      motivo TEXT,
      tentativas INT DEFAULT 1,
      ultima_tentativa TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function salvarEdital(edital) {
  const {
    idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
    objeto, link, cnpj, tipo, modo_disputa, registro_preco,
    fonte_orcamentaria, data_divulgacao, situacao,
    data_inicio, data_fim, valor_total, itens_detalhados,
    fonte_sistema
  } = edital;

  await pool.query(`
    INSERT INTO editais_completo (
      idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
      objeto, link, cnpj, tipo, modo_disputa, registro_preco,
      fonte_orcamentaria, data_divulgacao, situacao,
      data_inicio, data_fim, valor_total, itens_detalhados, fonte_sistema
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    ON CONFLICT (idpncp) DO NOTHING
  `, [
    idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
    objeto, link, cnpj, tipo, modo_disputa, registro_preco,
    fonte_orcamentaria, data_divulgacao, situacao,
    data_inicio, data_fim, valor_total, itens_detalhados, fonte_sistema
  ]);
}

async function registrarErroEdital(idpncp, motivo) {
  const res = await pool.query(
    `SELECT tentativas FROM editais_erros WHERE idpncp = $1`,
    [idpncp]
  );
  if (res.rowCount > 0) {
    await pool.query(
      `UPDATE editais_erros SET tentativas = tentativas + 1, ultima_tentativa = CURRENT_TIMESTAMP WHERE idpncp = $1`,
      [idpncp]
    );
  } else {
    await pool.query(
      `INSERT INTO editais_erros (idpncp, motivo) VALUES ($1, $2)`,
      [idpncp, motivo]
    );
  }
}

async function editalExiste(idpncp) {
  const res = await pool.query("SELECT 1 FROM editais_completo WHERE idpncp = $1", [idpncp]);
  return res.rowCount > 0;
}

async function consultarIdsExistentes(ids) {
  const res = await pool.query(
    `SELECT idpncp FROM editais_completo WHERE idpncp = ANY($1)`,
    [ids]
  );
  return res.rows.map(row => row.idpncp);
}

async function getContadorExecucoes() {
  const res = await pool.query("SELECT contador FROM execucoes_bot ORDER BY id DESC LIMIT 1");
  return res.rows[0]?.contador || 0;
}

async function setContadorExecucoes(contador) {
  await pool.query("INSERT INTO execucoes_bot (contador) VALUES ($1)", [contador]);
}

module.exports = {
  salvarEdital,
  editalExiste,
  inicializarBanco,
  consultarIdsExistentes,
  getContadorExecucoes,
  setContadorExecucoes,
  registrarErroEdital
};
