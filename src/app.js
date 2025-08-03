// src/app.js
import dotenv from 'dotenv'
dotenv.config()
import { cadastro, login, verificarSessaoAPI } from './supabase/auth.js'
import { protegerRota } from './middleware/auth.js'
import express from 'express'
import { fileURLToPath } from 'url'
import path, { join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const alternativePORT = 3001

// Middlewares
app.use(express.json())
app.use(express.static(join(__dirname, '../public')))

const viewsPath = join(__dirname, 'views')

// Rotas públicas (sem proteção)
app.get('/debug-auth', (req, res) => res.sendFile(join(viewsPath, 'debug-auth.html')))
app.get('/debug-completo', (req, res) => res.sendFile(join(viewsPath, 'debug-completo.html')))

app.get('/',                    (req, res) => res.sendFile(join(viewsPath, 'index.html')))
app.get('/login',               (req, res) => res.sendFile(join(viewsPath, 'login.html')))
app.get('/cadastro',            (req, res) => res.sendFile(join(viewsPath, 'cadastro.html')))
app.get('/recuperar-senha',     (req, res) => res.sendFile(join(viewsPath, 'recuperar-senha.html')))

// Rotas protegidas (requerem autenticação no client-side)
app.get('/teste-protegido', protegerRota, (req, res) => res.sendFile(join(viewsPath, 'teste-protegido.html')))

app.get('/inicio',              protegerRota, (req, res) => res.sendFile(join(viewsPath, 'inicio.html')))
app.get('/perfil',              protegerRota, (req, res) => res.sendFile(join(viewsPath, 'perfil.html')))
app.get('/configuracoes',       protegerRota, (req, res) => res.sendFile(join(viewsPath, 'configuracoes.html')))
app.get('/historico',           protegerRota, (req, res) => res.sendFile(join(viewsPath, 'historico.html')))
app.get('/suporte-tecnico',     protegerRota, (req, res) => res.sendFile(join(viewsPath, 'suporte-tecnico.html')))
app.get('/avaliacao',           protegerRota, (req, res) => res.sendFile(join(viewsPath, 'avaliacao.html')))
app.get('/agendar-consulta',    protegerRota, (req, res) => res.sendFile(join(viewsPath, 'agendarConsulta.html')))
app.get('/hospital',            protegerRota, (req, res) => res.sendFile(join(viewsPath, 'hospital.html')))
app.get('/hospitais-cadastrados', protegerRota, (req, res) => res.sendFile(join(viewsPath, 'hospitaisCadastrados.html')))
app.get('/hospitais-lotacao',   protegerRota, (req, res) => res.sendFile(join(viewsPath, 'hospitaisLotacao.html')))
app.get('/hospitais-procurados', protegerRota, (req, res) => res.sendFile(join(viewsPath, 'hospitaisProcurados.html')))
app.get('/hospitais-proximos',  protegerRota, (req, res) => res.sendFile(join(viewsPath, 'hospitaisProximos.html')))

// Rota especial - cadastro de contribuintes (decidir se é pública ou protegida)
app.get('/cadastro-contribuintes', (req, res) => res.sendFile(join(viewsPath, 'cadastroContribuintes.html')))

// Endpoints da API
app.post('/api/cadastro', async (req, res) => {
    try {
        const { email, senha } = req.body
        const result = await cadastro(email, senha)
        res.json(result)
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

app.post('/api/entrada', async (req, res) => {
    try {
        const { email, senha } = req.body
        const result = await login(email, senha)
        res.json(result)
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

app.get('/api/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    })
})

// Iniciar servidor
const PORT = process.env.PORT || alternativePORT
app.listen(PORT, () =>
    console.log(`Servidor rodando em http://localhost:${PORT}`)
)