// ===== API ENDPOINTS DE AUTENTICAÇÃO =====
import express from 'express';
import protectRoute from '../middlewares/protectRoute.js'
import supabase from "../db/supabase.js";

const userRouter = express();

// Endpoint de Cadastro
userRouter.post('/api/user/signup', async (req, res) => {
        const { email, password , name , phone , birth , cpf } = req.body;
        if (!email || !password || password.length < 8) {
            return res.status(400).json({ error: 'Dados de cadastro inválidos.' });
        }
        const { error } = await supabase.auth.signUp({  
            email, 
            password,
            options: {
                data: {
                full_name: name,
                phone_number: phone,
                birthdate: birth,
                cpf: cpf,
                full_user_access: false
                }
            }
        });
    if (error) {
        const errorMessage = error.message.includes('User already registered')
            ? 'Este e-mail já está cadastrado.'
            : 'Ocorreu um erro ao tentar o cadastro.';
        return res.status(400).json({ error: errorMessage });
    }
    res.status(201).json({ message: 'Cadastro realizado! Verifique seu e-mail.' });
});

userRouter.post('/api/user/login', async (req, res) => {
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
userRouter.post('/api/user/logout', (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.status(200).json({ message: 'Logout realizado com sucesso.' });
});

userRouter.get('/api/user/auth', protectRoute, async (req, res) => {
    // Se o middleware 'protectRoute' passou, o usuário é válido.
    const accessToken = req.cookies['sb-access-token'];

    // Se não houver token, retorne um erro (embora o protectRoute já deva fazer isso).
    if (!accessToken) {
        return res.status(401).json({ error: 'Token de acesso não fornecido.' });
    }

    // Usamos o token para obter os detalhes do usuário do Supabase.
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
        // Se houver um erro ou o usuário não for encontrado, retorna um erro.
        return res.status(401).json({ error: 'Falha ao autenticar usuário. Token inválido ou expirado.' });
    }

    // Retorna as informações seguras do usuário, incluindo os metadados.
    res.status(200).json({ user: true})
});

userRouter.get('/api/user/full_access', protectRoute, async (req, res) => {
    // Se o middleware 'protectRoute' passou, o usuário é válido.
    const accessToken = req.cookies['sb-access-token'];

    // Se não houver token, retorne um erro (embora o protectRoute já deva fazer isso).
    if (!accessToken) {
        return res.status(401).json({ error: 'Token de acesso não fornecido.' });
    }

    // Usamos o token para obter os detalhes do usuário do Supabase.
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
        // Se houver um erro ou o usuário não for encontrado, retorna um erro.
        return res.status(401).json({ error: 'Falha ao autenticar usuário. Token inválido ou expirado.' });
    }

    // Retorna as informações seguras do usuário, incluindo os metadados.
    res.status(200).json({ full_user_access: user.user_metadata?.full_user_access ?? false });
});

userRouter.get('/api/user/data', protectRoute, async (req, res) => {
    // Se o middleware 'protectRoute' passou, o usuário é válido.
    const accessToken = req.cookies['sb-access-token'];

    // Se não houver token, retorne um erro (embora o protectRoute já deva fazer isso).
    if (!accessToken) {
        return res.status(401).json({ error: 'Token de acesso não fornecido.' });
    }

    // Usamos o token para obter os detalhes do usuário do Supabase.
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
        // Se houver um erro ou o usuário não for encontrado, retorna um erro.
        return res.status(401).json({ error: 'Falha ao autenticar usuário. Token inválido ou expirado.' });
    }

    // Retorna as informações seguras do usuário, incluindo os metadados.
    res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? null,
        phone: user.user_metadata?.phone_number ?? null,
        birth: user.user_metadata?.birthdate ?? null,
        cpf: user.user_metadata?.cpf ?? null
    });
});

export default userRouter;