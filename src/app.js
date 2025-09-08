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
import { title } from 'process';

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
    const accessToken = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];

    if (!accessToken && !refreshToken) {
        return res.redirect('/login');
    }

    // Tenta validar o token de acesso principal
    if (accessToken) {
        const { error } = await supabase.auth.getUser(accessToken);
        if (!error) {
            // Token de acesso válido, continuar.
            return next();
        }
    }

    // Se o token de acesso falhou (expirado) ou estava ausente, tenta usar o refresh token
    if (refreshToken) {
        console.log("Token de acesso expirado. Tentando atualizar a sessão...");
        const { data, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
        });

        if (refreshError) {
            // Refresh token inválido ou expirado. Limpar e redirecionar para login.
            res.clearCookie('sb-access-token');
            res.clearCookie('sb-refresh-token');
            return res.redirect('/login');
        }

        // Sessão atualizada com sucesso! Definir novos cookies.
        const session = data.session;
        res.cookie('sb-access-token', session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Usar 'lax' pode ser melhor para desenvolvimento
            maxAge: session.expires_in * 1000,
        });
        res.cookie('sb-refresh-token', session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        console.log("Sessão atualizada com sucesso.");
        return next(); // Continuar para a rota protegida com a nova sessão

    } else {
        // Se chegou aqui, não há tokens válidos.
        return res.redirect('/login');
    }
};

// ===== ROTAS PÚBLICAS =====
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login', {title: 'Saúde Access', heading: 'Login'}));
app.get('/cadastro', (req, res) => res.render('cadastro'));
// ... (suas outras rotas públicas)

// ===== ROTAS PROTEGIDAS =====
// O middleware 'protectRoute' é aplicado a cada rota que precisa de login
app.get('/inicio', protectRoute, (req, res) => res.render('inicio'));
app.get('/perfil', protectRoute, (req, res) => res.render('perfil'));
app.get('/configuracoes', protectRoute, (req, res) => res.render('configuracoes'));
app.get('/historico', protectRoute, (req, res) => res.render('historico'));
app.get('/suporte-tecnico', protectRoute, (req, res) => res.render('suporteTecnico'));
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
        console.error("🔴 Supabase signUp error:", error);
        const errorMessage = error.message.includes('User already registered')
            ? 'Este e-mail já está cadastrado.'
            : error.message;
        return res.status(400).json({ error: errorMessage });
    }
    res.status(201).json({ message: 'Cadastro realizado! Verifique seu e-mail.' });
});

app.post('/api/verifyPassword', protectRoute, async (req, res) => {
    const { currentPassword } = req.body;

    if (!currentPassword) {
        return res.status(400).json({ error: 'A senha atual é obrigatória.' });
    }

    try {
        // 1. Obter o e-mail do usuário logado a partir do token de acesso.
        const accessToken = req.cookies['sb-access-token'];
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

        if (userError) {
            // Isso pode acontecer se o token expirou entre o carregamento da página e o clique no botão.
            return res.status(401).json({ error: 'Sua sessão expirou. Por favor, recarregue a página.' });
        }

        // 2. Tentar fazer login com o e-mail do usuário logado e a senha fornecida.
        // Esta é a forma padrão do Supabase de verificar se a senha está correta.
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
        });

        if (signInError) {
            // Se signInError existir, a senha está incorreta.
            console.warn(`Falha na reautenticação para ${user.email}: Senha incorreta.`);
            return res.status(401).json({ success: false, error: 'Senha atual incorreta.' });
        }

        // Se não houver erro, a senha está correta.
        return res.status(200).json({ success: true, message: 'Senha verificada com sucesso.' });

    } catch (err) {
        console.error("Erro inesperado durante a verificação de senha:", err);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.post('/api/changeEmail', protectRoute, async (req, res) => {
    const { newEmail } = req.body;
    const accessToken = req.cookies['sb-access-token'];

    if (!newEmail) {
        return res.status(400).json({ error: 'O novo e-mail é obrigatório.' });
    }

    // Validação simples de formato de e-mail (adapte se tiver uma função de utilitário)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({ error: 'Formato de e-mail inválido.' });
    }

    try {
        // A função updateUser do Supabase lida com o envio de e-mails de confirmação
        const { error } = await supabase.auth.updateUser(
            { email: newEmail },
            { accessToken: accessToken } // Garante que estamos atualizando o usuário autenticado
        );

        if (error) {
            console.error("Erro ao atualizar e-mail no Supabase:", error);
            // Mensagem de erro comum se o e-mail já estiver em uso por outro usuário
            if (error.message.includes("Email address already in use")) {
                 return res.status(409).json({ error: 'Este endereço de e-mail já está sendo usado por outra conta.' });
            }
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ message: 'Solicitação de alteração recebida. Verifique seu novo e-mail para confirmar a mudança.' });

    } catch (err) {
        console.error("Erro inesperado ao alterar e-mail:", err);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.post('/api/changePassword', protectRoute, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
        }

        // Recupera o token de acesso do cookie
        const accessToken = req.cookies['sb-access-token'];

        // Atualiza a senha do usuário logado
        const { data, error } = await supabase.auth.updateUser(
            { password },
            { accessToken } // <-- garante que está atualizando o usuário autenticado
        );

        if (error) {
            console.error("Erro ao atualizar senha:", error);
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ message: 'Senha alterada com sucesso!' });

    } catch (err) {
        console.error("Erro inesperado:", err);
        return res.status(500).json({ error: 'Erro interno ao trocar senha.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return res.status(401).json({ error: error.message });
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

console.log(`Se você está vendo isso, sinal de que já não o principal, pois evoluí`)