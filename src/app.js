// src/app.js
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { fileURLToPath } from 'url'
import path, { join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const alternativePORT = 3001

// Middlewares básicos
app.use(express.json())
app.use(express.static(join(__dirname, '../public')))

const viewsPath = join(__dirname, 'views')

// ===== ROTAS PÚBLICAS (sem autenticação) =====
app.get('/',                     (req, res) => res.sendFile(join(viewsPath, 'index.html')))
app.get('/login',                (req, res) => res.sendFile(join(viewsPath, 'login.html')))
app.get('/cadastro',             (req, res) => res.sendFile(join(viewsPath, 'cadastro.html')))
app.get('/recuperar-senha',      (req, res) => res.sendFile(join(viewsPath, 'recuperar-senha.html')))
app.get('/cadastro-contribuintes', (req, res) => res.sendFile(join(viewsPath, 'cadastroContribuintes.html')))

// Rotas de debug (remover em produção)
app.get('/debug-auth',           (req, res) => res.sendFile(join(viewsPath, 'debug-auth.html')))
app.get('/debug-completo',       (req, res) => res.sendFile(join(viewsPath, 'debug-completo.html')))

// ===== ROTAS PROTEGIDAS (proteção client-side via auth-utils.js) =====
// Estas páginas devem ter class="protected" no <body>
app.get('/inicio',               (req, res) => res.sendFile(join(viewsPath, 'inicio.html')))
app.get('/perfil',               (req, res) => res.sendFile(join(viewsPath, 'perfil.html')))
app.get('/configuracoes',        (req, res) => res.sendFile(join(viewsPath, 'configuracoes.html')))
app.get('/historico',            (req, res) => res.sendFile(join(viewsPath, 'historico.html')))
app.get('/suporte-tecnico',      (req, res) => res.sendFile(join(viewsPath, 'suporte-tecnico.html')))
app.get('/avaliacao',            (req, res) => res.sendFile(join(viewsPath, 'avaliacao.html')))
app.get('/agendar-consulta',     (req, res) => res.sendFile(join(viewsPath, 'agendarConsulta.html')))
app.get('/hospital',             (req, res) => res.sendFile(join(viewsPath, 'hospital.html')))
app.get('/hospitais-cadastrados', (req, res) => res.sendFile(join(viewsPath, 'hospitaisCadastrados.html')))
app.get('/hospitais-lotacao',    (req, res) => res.sendFile(join(viewsPath, 'hospitaisLotacao.html')))
app.get('/hospitais-procurados', (req, res) => res.sendFile(join(viewsPath, 'hospitaisProcurados.html')))
app.get('/hospitais-proximos',   (req, res) => res.sendFile(join(viewsPath, 'hospitaisProximos.html')))
app.get('/teste-protegido',      (req, res) => res.sendFile(join(viewsPath, 'teste-protegido.html')))

// ===== API ENDPOINTS =====
app.get('/api/config', (req, res) => {
    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
        return res.status(500).json({ 
            error: 'Configuração do servidor incompleta' 
        })
    }
    
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    })
})

// ===== INICIALIZAÇÃO DO SERVIDOR =====
const PORT = process.env.PORT || alternativePORT

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
    // Verificar variáveis de ambiente
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.warn('⚠️  ATENÇÃO: Variáveis do Supabase não configuradas!')
        console.warn('   Configure SUPABASE_URL e SUPABASE_ANON_KEY')
    } else {
        console.log('Variáveis do Supabase configuradas')
    }
})