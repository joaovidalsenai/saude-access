const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Inicializar banco de dados
const db = new sqlite3.Database('./saude_access.db', (err) => {
    if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        initializeDatabase();
    }
});

// Função para inicializar tabelas
function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS contribuintes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            telefone TEXT,
            data_nascimento DATE,
            funcao TEXT,
            condicao_trabalhista TEXT,
            foto_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Erro ao criar tabela:', err.message);
        } else {
            console.log('Tabela contribuintes criada ou já existe.');
        }
    });

    // Criar tabela de feedback
    const createFeedbackTableQuery = `
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            email TEXT,
            mensagem TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(createFeedbackTableQuery, (err) => {
        if (err) {
            console.error('Erro ao criar tabela feedback:', err.message);
        } else {
            console.log('Tabela feedback criada ou já existe.');
        }
    });
}

// Rotas da API

// Rota para servir o HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET - Listar todos os contribuintes
app.get('/api/contribuintes', (req, res) => {
    const query = 'SELECT * FROM contribuintes ORDER BY created_at DESC';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar contribuintes:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        } else {
            res.json(rows);
        }
    });
});

// GET - Buscar contribuinte por ID
app.get('/api/contribuintes/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM contribuintes WHERE id = ?';
    
    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar contribuinte:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Contribuinte não encontrado' });
        }
    });
});

// POST - Criar novo contribuinte
app.post('/api/contribuintes', upload.single('foto'), (req, res) => {
    const {
        nome,
        email,
        telefone,
        data_nascimento,
        funcao,
        condicao_trabalhista
    } = req.body;

    // Validação básica
    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const foto_path = req.file ? req.file.path : null;

    const query = `
        INSERT INTO contribuintes (nome, email, telefone, data_nascimento, funcao, condicao_trabalhista, foto_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [nome, email, telefone, data_nascimento, funcao, condicao_trabalhista, foto_path];

    db.run(query, params, function(err) {
        if (err) {
            console.error('Erro ao inserir contribuinte:', err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(409).json({ error: 'Email já cadastrado' });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        } else {
            res.status(201).json({
                message: 'Contribuinte criado com sucesso',
                id: this.lastID,
                data: {
                    id: this.lastID,
                    nome,
                    email,
                    telefone,
                    data_nascimento,
                    funcao,
                    condicao_trabalhista,
                    foto_path
                }
            });
        }
    });
});

// PUT - Atualizar contribuinte
app.put('/api/contribuintes/:id', upload.single('foto'), (req, res) => {
    const id = req.params.id;
    const {
        nome,
        email,
        telefone,
        data_nascimento,
        funcao,
        condicao_trabalhista
    } = req.body;

    let query = `
        UPDATE contribuintes 
        SET nome = ?, email = ?, telefone = ?, data_nascimento = ?, 
            funcao = ?, condicao_trabalhista = ?, updated_at = CURRENT_TIMESTAMP
    `;
    
    let params = [nome, email, telefone, data_nascimento, funcao, condicao_trabalhista];

    if (req.file) {
        query += ', foto_path = ?';
        params.push(req.file.path);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) {
            console.error('Erro ao atualizar contribuinte:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Contribuinte não encontrado' });
        } else {
            res.json({ message: 'Contribuinte atualizado com sucesso' });
        }
    });
});

// DELETE - Deletar contribuinte
app.delete('/api/contribuintes/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM contribuintes WHERE id = ?';

    db.run(query, [id], function(err) {
        if (err) {
            console.error('Erro ao deletar contribuinte:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Contribuinte não encontrado' });
        } else {
            res.json({ message: 'Contribuinte deletado com sucesso' });
        }
    });
});

// POST - Criar feedback
app.post('/api/feedback', (req, res) => {
    const { nome, email, mensagem } = req.body;

    if (!mensagem) {
        return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    const query = 'INSERT INTO feedback (nome, email, mensagem) VALUES (?, ?, ?)';
    const params = [nome, email, mensagem];

    db.run(query, params, function(err) {
        if (err) {
            console.error('Erro ao inserir feedback:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        } else {
            res.status(201).json({
                message: 'Feedback enviado com sucesso',
                id: this.lastID
            });
        }
    });
});

// GET - Listar feedback
app.get('/api/feedback', (req, res) => {
    const query = 'SELECT * FROM feedback ORDER BY created_at DESC';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar feedback:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        } else {
            res.json(rows);
        }
    });
});

// Rota para servir arquivos de upload
app.use('/uploads', express.static('uploads'));

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nEncerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar banco de dados:', err.message);
        } else {
            console.log('Conexão com banco de dados encerrada.');
        }
        process.exit(0);
    });
});