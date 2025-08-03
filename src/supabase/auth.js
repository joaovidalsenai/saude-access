// src/supabase/auth.js
import { createClient } from '@supabase/supabase-js'

let supabase = null

function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidas')
        }
        
        supabase = createClient(supabaseUrl, supabaseKey)
    }
    return supabase
}

export async function cadastro(email, senha) {
    try {
        const client = getSupabaseClient()
        
        let { data, error } = await client.auth.signUp({
            email: email,
            password: senha
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function login(email, senha) {
    try {
        const client = getSupabaseClient()
        
        let { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: senha
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function logout() {
    try {
        const client = getSupabaseClient()
        
        let { error } = await client.auth.signOut()
        
        if (error) {
            throw error
        }
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function obterUsuarioAtual() {
    try {
        const client = getSupabaseClient()
        
        const { data: { user }, error } = await client.auth.getUser()
        
        if (error) {
            throw error
        }
        
        return { success: true, user }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Função original (mantida para uso direto)
export async function verificarSessao() {
    try {
        const client = getSupabaseClient();
        
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        return { success: true, session };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Nova função para verificar com token do frontend
export async function verificarSessaoComToken(accessToken) {
    try {
        const client = getSupabaseClient();
        
        // Verifica o usuário diretamente com o token
        // Não precisa fazer setSession no servidor
        const { data: { user }, error } = await client.auth.getUser(accessToken);
        
        if (error) {
            throw error;
        }
        
        if (!user) {
            return { success: false, error: 'Token inválido ou expirado' };
        }
        
        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                created_at: user.created_at
            }
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Função para o endpoint da API (CORRIGIDA)
export async function verificarSessaoAPI(accessToken) {
    // Agora está passando o accessToken corretamente
    return await verificarSessaoComToken(accessToken);
}


export async function recuperarSenha(email) {
    try {
        const client = getSupabaseClient()
        
        let { data, error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/redefinir-senha`
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function redefinirSenha(novaSenha, accessToken) {
    try {
        const client = getSupabaseClient()
        
        // Define a sessão com o token de acesso
        const { data: sessionData, error: sessionError } = await client.auth.setSession({
            access_token: accessToken,
            refresh_token: '' // Pode ser vazio para reset de senha
        })
        
        if (sessionError) {
            throw sessionError
        }
        
        // Atualiza a senha
        const { data, error } = await client.auth.updateUser({
            password: novaSenha
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function atualizarPerfil(dadosUsuario) {
    try {
        const client = getSupabaseClient()
        
        const { data, error } = await client.auth.updateUser({
            data: dadosUsuario // { nome: 'João', telefone: '11999999999', etc. }
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function alterarSenha(senhaAtual, novaSenha) {
    try {
        const client = getSupabaseClient()
        
        // Primeiro verifica se a senha atual está correta
        const { data: user } = await client.auth.getUser()
        if (!user) {
            throw new Error('Usuário não autenticado')
        }
        
        // Tenta fazer login com a senha atual para verificar
        const { error: loginError } = await client.auth.signInWithPassword({
            email: user.user.email,
            password: senhaAtual
        })
        
        if (loginError) {
            throw new Error('Senha atual incorreta')
        }
        
        // Se chegou aqui, a senha atual está correta, então atualiza
        const { data, error } = await client.auth.updateUser({
            password: novaSenha
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function reenviarConfirmacao(email) {
    try {
        const client = getSupabaseClient()
        
        let { data, error } = await client.auth.resend({
            type: 'signup',
            email: email
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

export async function confirmarEmail(token, email) {
    try {
        const client = getSupabaseClient()
        
        const { data, error } = await client.auth.verifyOtp({
            email,
            token,
            type: 'email'
        })
        
        if (error) {
            throw error
        }
        
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Função auxiliar para verificar se usuário está autenticado
export async function estaAutenticado() {
    try {
        const resultado = await verificarSessao()
        return resultado.success && resultado.session !== null
    } catch (error) {
        return false
    }
}

// Função para obter dados completos do usuário (sessão + perfil)
export async function obterDadosCompletos() {
    try {
        const client = getSupabaseClient()
        
        const { data: { session }, error: sessionError } = await client.auth.getSession()
        
        if (sessionError || !session) {
            return { success: false, error: 'Usuário não autenticado' }
        }
        
        return {
            success: true,
            usuario: session.user,
            sessao: session,
            perfil: session.user.user_metadata || {}
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}