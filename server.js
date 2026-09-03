
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Servir o arquivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Listar Vagas
app.get('/api/vagas', (req, res) => {
    db.all("SELECT * FROM vagas ORDER BY codigo ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ mensagem: err.message });
        res.json(rows);
    });
});

// Entrada
app.post('/api/entrada', (req, res) => {
    const { placa, vagaCodigo } = req.body;
    if (!placa || !vagaCodigo) return res.status(400).json({ mensagem: 'Preencha placa e vaga!' });

    const placaU = placa.trim().toUpperCase();
    const vagaU = vagaCodigo.trim().toUpperCase();

    db.get("SELECT * FROM vagas WHERE UPPER(codigo) = ?", [vagaU], (err, vaga) => {
        if (err) return res.status(500).json({ mensagem: err.message });
        if (!vaga) return res.status(404).json({ mensagem: `Vaga ${vagaU} não existe.` });
        if (vaga.status === 'OCUPADA') return res.status(400).json({ mensagem: `Vaga ${vagaU} já está ocupada!` });

        db.run(
            "INSERT INTO movimentacoes (placa, vaga_codigo, entrada) VALUES (?, ?, ?)",
            [placaU, vaga.codigo, new Date().toISOString()],
            (err) => {
                if (err) return res.status(500).json({ mensagem: err.message });

                db.run("UPDATE vagas SET status = 'OCUPADA' WHERE codigo = ?", [vaga.codigo], (err) => {
                    if (err) return res.status(500).json({ mensagem: err.message });
                    res.json({ mensagem: `Entrada da placa ${placaU} confirmada na vaga ${vaga.codigo}!` });
                });
            }
        );
    });
});

// Saída
app.post('/api/saida', (req, res) => {
    const { placa } = req.body;
    if (!placa) return res.status(400).json({ mensagem: 'Preencha a placa!' });

    const placaU = placa.trim().toUpperCase();

    db.get("SELECT * FROM movimentacoes WHERE UPPER(placa) = ? AND pago = 0", [placaU], (err, reg) => {
        if (err) return res.status(500).json({ mensagem: err.message });
        if (!reg) return res.status(404).json({ mensagem: 'Veículo não encontrado no pátio.' });

        const valorTotal = 10; // R$ 10,00 padrão

        db.run(
            "UPDATE movimentacoes SET saida = ?, valor_total = ?, pago = 1 WHERE id = ?",
            [new Date().toISOString(), valorTotal, reg.id],
            (err) => {
                if (err) return res.status(500).json({ mensagem: err.message });

                db.run("UPDATE vagas SET status = 'LIVRE' WHERE codigo = ?", [reg.vaga_codigo], (err) => {
                    if (err) return res.status(500).json({ mensagem: err.message });
                    res.json({ mensagem: `Saída efetuada!`, valorPagar: valorTotal });
                });
            }
        );
    });
});

app.listen(PORT, () => {
    console.log(`[OK] Servidor rodando em http://localhost:${PORT}`);
});
