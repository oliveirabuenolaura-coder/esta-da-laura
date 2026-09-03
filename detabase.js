const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'estacionamento.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[BD] Erro de conexão:', err.message);
    } else {
        console.log('[BD] Banco SQLite conectado.');
    }
});

db.serialize(() => {
    // Criar tabela de vagas
    db.run(`
    CREATE TABLE IF NOT EXISTS vagas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      tipo TEXT DEFAULT 'NORMAL',
      status TEXT DEFAULT 'LIVRE'
    )
  `);

    // Criar tabela de movimentações
    db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL,
      vaga_codigo TEXT NOT NULL,
      entrada TEXT NOT NULL,
      saida TEXT,
      valor_total REAL DEFAULT 0,
      pago INTEGER DEFAULT 0
    )
  `);

    // Garante que as vagas A1, A2, A3, P1, I1, M1 existam
    const vagasIniciais = [
        ['A1', 'NORMAL'], ['A2', 'NORMAL'], ['A3', 'NORMAL'],
        ['P1', 'PCD'], ['I1', 'IDOSO'], ['M1', 'MOTO']
    ];

    const stmt = db.prepare("INSERT OR IGNORE INTO vagas (codigo, tipo) VALUES (?, ?)");
    vagasIniciais.forEach(([codigo, tipo]) => stmt.run(codigo, tipo));
    stmt.finalize(() => {
        console.log('[BD] Vagas inicializadas com sucesso.');
    });
});

module.exports = db;
