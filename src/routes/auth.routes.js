// ===== API ENDPOINTS DE AUTENTICAÇÃO =====
import express from 'express';
import protect from '../middlewares/protect.route.js';
import supabase from "../db/supabase.js";

const auth = express.Router();

// Endpoint de Cadastro
auth.post('/auth/cadastrar', async (req, res) => {
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

auth.post('/auth/entrar', async (req, res) => {
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
auth.post('/auth/sair', (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.status(200).json({ message: 'Logout realizado com sucesso.' });
});

auth.get('/auth', protect.partially, async (req, res) => {
    // Se o middleware 'protect.entirely' passou, o usuário é válido.
    const accessToken = req.cookies['sb-access-token'];

    // Se não houver token, retorne um erro (embora o protect.entirely já deva fazer isso).
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

auth.post('/auth/alterar/email', protect.entirely, async (req, res) => {
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

auth.post('/auth/alterar/senha', protect.entirely, async (req, res) => {
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

auth.post('/auth/verificar', protect.entirely, async (req, res) => {
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

auth.post('/auth/recuperar-senha', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'O e-mail é obrigatório.' });
    }

    // O Supabase envia o e-mail de redefinição de senha.
    // Importante: Por segurança, o Supabase não retorna um erro se o e-mail não existir,
    // para evitar que invasores descubram quais e-mails estão cadastrados.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `http://localhost:3001/redefinir-senha`, // URL para onde o usuário será redirecionado após clicar no link do e-mail
    });

    if (error) {
        console.error("Erro ao solicitar recuperação de senha:", error);
        // Retorna um erro genérico para o cliente
        return res.status(500).json({ error: 'Ocorreu um erro ao processar sua solicitação.' });
    }

    // A resposta é sempre de sucesso para o cliente, mesmo que o e-mail não exista.
    res.status(200).json({ message: 'Se o e-mail estiver cadastrado, um link de recuperação foi enviado.' });
});

auth.post('/auth/redefinir-senha', async (req, res) => {
    const { accessToken, novaSenha } = req.body;

    if (!accessToken || !novaSenha) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    if (novaSenha.length < 8) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
    }

    // O Supabase usa o accessToken (que vem da URL) para verificar a identidade do usuário
    // e então atualiza a senha.
    const { error } = await supabase.auth.updateUser(
        { password: novaSenha },
        { accessToken: accessToken }
    );

    if (error) {
        console.error("Erro ao atualizar a senha do usuário:", error);
        // O token pode ser inválido, expirado, ou já utilizado.
        return res.status(401).json({ error: 'Não foi possível atualizar a senha. O token pode ser inválido ou ter expirado.' });
    }

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });
});

export default auth;