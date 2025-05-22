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
      itens_detalhados TEXT, coletado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS execucoes_bot (
      id SERIAL PRIMARY KEY,
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      contador INT DEFAULT 0
    );
  `);
}

async function salvarEdital(edital) {
  const {
    idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
    objeto, link, cnpj, tipo, modo_disputa, registro_preco,
    fonte_orcamentaria, data_divulgacao, situacao,
    data_inicio, data_fim, valor_total, itens_detalhados
  } = edital;

  await pool.query(`
    INSERT INTO editais_completo (
      idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
      objeto, link, cnpj, tipo, modo_disputa, registro_preco,
      fonte_orcamentaria, data_divulgacao, situacao,
      data_inicio, data_fim, valor_total, itens_detalhados
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    ON CONFLICT (idpncp) DO NOTHING
  `, [
    idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
    objeto, link, cnpj, tipo, modo_disputa, registro_preco,
    fonte_orcamentaria, data_divulgacao, situacao,
    data_inicio, data_fim, valor_total, itens_detalhados
  ]);
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
  setContadorExecucoes
};
