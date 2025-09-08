// ===== API ENDPOINTS DE AUTENTICAÇÃO =====
import express from 'express';
import protect from '../middlewares/protectRoute.js';
import supabase from "../db/supabase.js";

const userRouter = express();

// Endpoint de Cadastro
userRouter.post('/api/user/signup', async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password || password.length < 8) {
            return res.status(400).json({ error: 'Dados de cadastro inválidos.' });
        }
        const { error } = await supabase.auth.signUp({  
            email, 
            password,
            options: {
                data: {
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
    const { email , password } = req.body;
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

userRouter.get('/api/user/auth', protect.partially, async (req, res) => {
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

userRouter.get('/api/user/data', protect.partially, async (req, res) => {
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
        email: user.email
    });
});

userRouter.post('/api/user/complete-profile', protect.partially, async (req, res) => {
    // 1. Get the authenticated user from the request (provided by the 'protect' middleware)
    const accessToken = req.cookies['sb-access-token'];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    const userId = user.id;

    // 2. Get the data from the request body
    const { name, birth, phone, cpf, address } = req.body;

    // 3. Basic validation
    if (!name || !birth || !phone || !cpf || !address) {
        return res.status(400).json({ error: 'Todos os campos do formulário são obrigatórios.' });
    }

    // 4. Insert the data into the 'profiles' table in Supabase
    const { data, error } = await supabase
        .from('profiles')
        .insert([
            {
                id: userId, // Link to the auth.users table
                full_name: name,
                birth_date: birth,
                phone: phone,
                cpf: cpf,
                address: address // Store the address object as JSON
            }
        ]);

    if (error) {
        console.error('Erro ao salvar perfil no Supabase:', error.message);
        // Handle cases where the profile might already exist
        if (error.code === '23505') { 
            return res.status(409).json({ error: 'As informações de perfil para este usuário já existem.' });
        }
        return res.status(500).json({ error: 'Não foi possível salvar as informações do perfil.' });
    }
    
    // 5. Optionally, update the user's metadata to grant full access
    await supabase.auth.updateUser({
        data: { full_user_access: true }
    });

    res.status(201).json({ message: 'Cadastro finalizado com sucesso!' });
});

export default userRouter;