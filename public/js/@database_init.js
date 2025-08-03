const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Criar banco de dados
const dbPath = './saude_access.db';

console.log('Inicializando banco de dados...');

// Remover banco existente se desejado (descomente a linha abaixo)
// if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao criar banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('Banco de dados SQLite criado/conectado com sucesso.');
    }
});

// Função para executar queries em série
function runQuery(query, description) {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                console.error(`Erro ao ${description}:`, err.message);
                reject(err);
            } else {
                console.log(`✓ ${description} executado com sucesso.`);
                resolve();
            }
        });
    });
}

// Função para inserir dados de exemplo
function insertSampleData() {
    return new Promise((resolve, reject) => {
        const sampleContribuintes = [
            {
                nome: 'Dr. João Silva',
                email: 'joao.silva@saude.com',
                telefone: '(11) 99999-1234',
                data_nascimento: '1980-05-15',
                funcao: 'cardiologista',
                condicao_trabalhista: ''
            },
            {
                nome: 'Enfermeira Maria Santos',
                email: 'maria.santos@saude.com',
                telefone: '(11) 99888-5678',
                data_nascimento: '1985-08-22',
                funcao: 'enfermeiro',
                condicao_trabalhista: 'stress_ocupacional'
            },
            {
                nome: 'Dr. Pedro Oliveira',
                email: 'pedro.oliveira@saude.com',
                telefone: '(11) 99777-9012',
                data_nascimento: '1975-12-03',
                funcao: 'neurologista',
                condicao_trabalhista: ''
            }
        ];

        const insertQuery = `
            INSERT INTO contribuintes (nome, email, telefone, data_nascimento, funcao, condicao_trabalhista)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        let completed = 0;
        sampleContribuintes.forEach((contribuinte, index) => {
            db.run(insertQuery, [
                contribuinte.nome,
                contribuinte.email,
                contribuinte.telefone,
                contribuinte.data_nascimento,
                contribuinte.funcao,
                contribuinte.condicao_trabalhista
            ], function(err) {
                if (err) {
                    console.error(`Erro ao inserir contribuinte ${index + 1}:`, err.message);
                } else {
                    console.log(`✓ Contribuinte "${contribuinte.nome}" inserido com ID: ${this.lastID}`);
                }
                
                completed++;
                if (completed === sampleContribuintes.length) {
                    resolve();
                }
            });
        });
    });
}

// Executar inicialização
async function initializeDatabase() {
    try {
        // Criar tabela de contribuintes
        await runQuery(`
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
        `, 'Criação da tabela contribuintes');

        // Criar tabela de feedback
        await runQuery(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT,
                email TEXT,
                mensagem TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Criação da tabela feedback');

        // Criar índices para melhor performance
        await runQuery(`
            CREATE INDEX IF NOT EXISTS idx_contribuintes_email ON contribuintes(email)
        `, 'Criação de índice para email');

        await runQuery(`
            CREATE INDEX IF NOT EXISTS idx_contribuintes_funcao ON contribuintes(funcao)
        `, 'Criação de índice para função');

        await runQuery(`
            CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at)
        `, 'Criação de índice para data de criação do feedback');

        // Verificar se já existem dados
        db.get('SELECT COUNT(*) as count FROM contribuintes', (err, row) => {
            if (err) {
                console.error('Erro ao verificar dados existentes:', err.message);
            } else if (row.count === 0) {
                console.log('\nInserindo dados de exemplo...');
                insertSampleData().then(() => {
                    console.log('\n✅ Banco de dados inicializado com sucesso!');
                    console.log('Dados de exemplo inseridos.');
                    closeDatabase();
                }).catch((err) => {
                    console.error('Erro ao inserir dados de exemplo:', err);
                    closeDatabase();
                });
            } else {
                console.log(`\n✅ Banco de dados já contém ${row.count} contribuintes.`);
                console.log('Inicialização concluída.');
                closeDatabase();
            }
        });

    } catch (error) {
        console.error('Erro durante inicialização:', error);
        closeDatabase();
    }
}

function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar banco de dados:', err.message);
        } else {
            console.log('Conexão com banco de dados encerrada.');
        }
        process.exit(0);
    });
}

// Executar inicialização
initializeDatabase();