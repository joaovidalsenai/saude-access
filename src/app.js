// src/app.js
import dotenv from 'dotenv'
dotenv.config()

import { cadastro, login } from './supabase/auth.js'
import express from 'express'
import { fileURLToPath } from 'url'
import path, { join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const app = express()
const alternativePORT = 3001;

// 2) Habilitar JSON no body
app.use(express.json())

// 3) Servir arquivos estáticos da pasta /public
app.use(express.static(join(__dirname, '../public')))

const viewsPath = join(__dirname, 'views');
app.get('/',                   (req, res) => res.sendFile(join(viewsPath, 'index.html')));
app.get('/login',              (req, res) => res.sendFile(join(viewsPath, 'login.html')));
app.get('/cadastro',           (req, res) => res.sendFile(join(viewsPath, 'cadastro.html')));
app.get('/cadastro-contribuintes', (req, res) => res.sendFile(join(viewsPath, 'cadastroContribuintes.html')));
app.get('/recuperar-senha',    (req, res) => res.sendFile(join(viewsPath, 'recuperarSenha.html')));
app.get('/inicio',             (req, res) => res.sendFile(join(viewsPath, 'inicio.html')));
app.get('/perfil',             (req, res) => res.sendFile(join(viewsPath, 'perfil.html')));
app.get('/configuracoes',      (req, res) => res.sendFile(join(viewsPath, 'configuracoes.html')));
app.get('/historico',          (req, res) => res.sendFile(join(viewsPath, 'historico.html')));
app.get('/suporte-tecnico',    (req, res) => res.sendFile(join(viewsPath, 'suporteTecnico.html')));
app.get('/avaliacao',          (req, res) => res.sendFile(join(viewsPath, 'avaliacao.html')));
app.get('/agendar-consulta',   (req, res) => res.sendFile(join(viewsPath, 'agendarConsulta.html')));
app.get('/hospital',           (req, res) => res.sendFile(join(viewsPath, 'hospital.html')));
app.get('/hospitais-cadastrados', (req, res) => res.sendFile(join(viewsPath, 'hospitaisCadastrados.html')));
app.get('/hospitais-lotacao',  (req, res) => res.sendFile(join(viewsPath, 'hospitaisLotacao.html')));
app.get('/hospitais-procurados', (req, res) => res.sendFile(join(viewsPath, 'hospitaisProcurados.html')));
app.get('/hospitais-proximos', (req, res) => res.sendFile(join(viewsPath, 'hospitaisProximos.html')));

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
    
// 6) Iniciar servidor
const PORT = process.env.PORT || alternativePORT
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
)
