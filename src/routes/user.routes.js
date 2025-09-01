// ===== API ENDPOINTS DE AUTENTICAÇÃO =====
import express from 'express';
import protectRoute from '../middleware/protectRoute.js'
import supabase from "../middleware/supabaseClient.js";

const userRouter = express();

// Endpoint de Cadastro
userRouter.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) {
        return res.status(400).json({ error: 'Dados de cadastro inválidos.' });
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        const errorMessage = error.message.includes('User already registered')
            ? 'Este e-mail já está cadastrado.'
            : 'Ocorreu um erro ao tentar o cadastro.';
        return res.status(400).json({ error: errorMessage });
    }
    res.status(201).json({ message: 'Cadastro realizado! Verifique seu e-mail.' });
});

userRouter.post('/api/login', async (req, res) => {
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
userRouter.post('/api/logout', (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.status(200).json({ message: 'Logout realizado com sucesso.' });
});

userRouter.get('/api/user', protectRoute, async (req, res) => {
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

export default userRouter;