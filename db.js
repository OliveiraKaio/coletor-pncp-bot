const { Pool } = require('pg');
const { DATABASE_URL } = require('./config');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function salvarEdital(edital) {
  const {
    idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
    objeto, link, cnpj, tipo, modo_disputa, registro_preco,
    fonte_orcamentaria, data_divulgacao, situacao,
    data_inicio, data_fim, valor_total, itens
  } = edital;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS editais_completo (
      idpncp TEXT PRIMARY KEY,
      titulo TEXT, modalidade TEXT, ultima_atualizacao TEXT,
      orgao TEXT, local TEXT, objeto TEXT, link TEXT,
      cnpj TEXT, tipo TEXT, modo_disputa TEXT, registro_preco TEXT,
      fonte_orcamentaria TEXT, data_divulgacao TEXT, situacao TEXT,
      data_inicio DATE, data_fim DATE, valor_total TEXT,
      itens TEXT, coletado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    INSERT INTO editais_completo (
      idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
      objeto, link, cnpj, tipo, modo_disputa, registro_preco,
      fonte_orcamentaria, data_divulgacao, situacao,
      data_inicio, data_fim, valor_total, itens
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,CAST($17 AS DATE),CAST($18 AS DATE),$19)
    ON CONFLICT (idpncp) DO NOTHING
  `, [
    idpncp, titulo, modalidade, ultima_atualizacao, orgao, local,
    objeto, link, cnpj, tipo, modo_disputa, registro_preco,
    fonte_orcamentaria, data_divulgacao, situacao,
    data_inicio, data_fim, valor_total, itens
  ]);
}

module.exports = { salvarEdital };