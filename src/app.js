// src/app.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { fileURLToPath } from 'url';
import path, { join } from 'path';

// NOVAS dependências para Supabase no backend e cookies
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const alternativePORT = 3001;

// INICIALIZAÇÃO do Supabase no servidor (seguro)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY 
);

// --- Middlewares ---
app.use(express.json());
app.use(cookieParser()); // Essencial para ler os cookies de autenticação
app.use(express.static(join(__dirname, '../public')));

// Configure EJS as view engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

const viewsPath = join(__dirname, 'views');

// ===== MIDDLEWARE DE PROTEÇÃO DE ROTAS (NOVO E ESSENCIAL) =====
const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies['sb-access-token'];

    // Se não há token, o usuário não está logado. Redireciona para o login.
    if (!accessToken) {
      return res.redirect('/login');
    }

    // Verifica com o Supabase se o token é válido
    const { error } = await supabase.auth.getUser(accessToken);

    if (error) {
      // Se o token for inválido (expirado, etc.), limpa os cookies e redireciona
      res.clearCookie('sb-access-token');
      res.clearCookie('sb-refresh-token');
      return res.redirect('/login');
    }

    // Se o token for válido, a requisição pode prosseguir para a rota protegida
    next();
  } catch (error) {
    return res.redirect('/login');
  }
};

// ===== ROTAS PÚBLICAS =====
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/cadastro', (req, res) => res.render('cadastro'));
// ... (suas outras rotas públicas)

// ===== ROTAS PROTEGIDAS =====
// O middleware 'protectRoute' é aplicado a cada rota que precisa de login
app.get('/inicio', protectRoute, (req, res) => res.render('inicio'));
app.get('/perfil', protectRoute, (req, res) => res.render('perfil'));
app.get('/configuracoes', protectRoute, (req, res) => res.render('configuracoes'));
app.get('/historico', protectRoute, (req, res) => res.render('historico'));
app.get('/suporte-tecnico', protectRoute, (req, res) => res.render('suporte-tecnico'));
app.get('/avaliacao', protectRoute, (req, res) => res.render('avaliacao'));
app.get('/agendar-consulta', protectRoute, (req, res) => res.render('agendarConsulta'));
app.get('/hospital', protectRoute, (req, res) => res.render('hospital'));
app.get('/hospitais-cadastrados', protectRoute, (req, res) => res.render('hospitaisCadastrados'));
app.get('/hospitais-lotacao', protectRoute, (req, res) => res.render('hospitaisLotacao'));
app.get('/hospitais-procurados', protectRoute, (req, res) => res.render('hospitaisProcurados'));
app.get('/hospitais-proximos', protectRoute, (req, res) => res.render('hospitaisProximos'));
app.get('/teste-protegido', protectRoute, (req, res) => res.render('teste-protegido'));
// ADICIONE 'protectRoute' A TODAS AS OUTRAS ROTAS QUE PRECISAM DE PROTEÇÃO

// ===== API ENDPOINTS DE AUTENTICAÇÃO =====

// Endpoint de Cadastro
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) {
        return res.status(400).json({ error: 'Dados de cadastro inválidos.' });
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        const errorMessage = error.message.includes('User already registered')
            ? 'Este e-mail já está cadastrado.'
            : error.message;
        return res.status(400).json({ error: errorMessage });
    }
    res.status(201).json({ message: 'Cadastro realizado! Verifique seu e-mail.' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }
    res.cookie('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: data.session.expires_in * 1000,
    });
    res.cookie('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({ message: 'Login bem-sucedido!' });
});

// Endpoint de Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.status(200).json({ message: 'Logout realizado com sucesso.' });
});

app.get('/api/user', protectRoute, async (req, res) => {
    // Se o middleware 'protectRoute' passou, sabemos que o usuário é válido.
    // O token de acesso está nos cookies.
    const accessToken = req.cookies['sb-access-token'];

    // Usamos o token para obter os detalhes do usuário do Supabase.
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error) {
        // Se houver um erro (improvável se o protectRoute passou), retorna um erro.
        return res.status(401).json({ error: 'Falha ao autenticar usuário.' });
    }

    // Retorna apenas as informações seguras do usuário (nunca a sessão inteira ou tokens!)
    res.status(200).json({
        id: user.id,
        email: user.email,
        // Adicione outros campos que você possa precisar, ex: user.user_metadata.full_name
    });
});


// ===== INICIALIZAÇÃO DO SERVIDOR =====
const PORT = process.env.PORT || alternativePORT;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
