// Em 'services/dadosUsuario.js' ou similar
import supabase from "../db/supabase.js";

// Criamos classes de erro personalizadas para melhor controle na rota
export class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError';
    }
}

export class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export default async function dadosUsuario(tokenDeAcesso) {
    // 1. Validação do token
    if (!tokenDeAcesso) {
        throw new AuthError('Token de acesso não fornecido.');
    }

    // 2. Autenticação do usuário com o Supabase
    const { data: { user }, error: erroAuth } = await supabase.auth.getUser(tokenDeAcesso);
    if (erroAuth || !user) {
        throw new AuthError('Usuário não autenticado ou token inválido.');
    }

    // 3. Busca dos dados no banco
    const { data: dadosDoPerfil, error: erroPerfil } = await supabase
        .from('cliente')
        .select('*, cliente_endereco (*)')
        .eq('cliente_id', user.id)
        .single();

    if (erroPerfil || !dadosDoPerfil) {
        // Lança um erro específico se o perfil não for encontrado
        console.error('Erro ao buscar perfil:', erroPerfil?.message);
        throw new NotFoundError('Perfil do usuário não encontrado.');
    }

    // 4. Formatação e retorno dos dados
    const perfilCompleto = {
        ...dadosDoPerfil,
        email: user.email,
        endereco: dadosDoPerfil.cliente_endereco,
    };
    delete perfilCompleto.enderecos;

    return perfilCompleto;
}