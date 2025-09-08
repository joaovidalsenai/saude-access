import express from 'express';
import protect from '../middlewares/protectRoute.js';
import supabase from "../db/supabase.js";

const profile = express();

// Endpoint para buscar os dados completos do usuário
profile.get('/api/user/data', protect.partially, async (req, res) => {
    try {
        const tokenDeAcesso = req.cookies['sb-access-token'];
        if (!tokenDeAcesso) {
            return res.status(401).json({ error: 'Token de acesso não fornecido.' });
        }

        const { data: { user }, error: erroAuth } = await supabase.auth.getUser(tokenDeAcesso);
        if (erroAuth || !user) {
            return res.status(401).json({ error: 'Usuário não autenticado ou token inválido.' });
        }

        // Busca o perfil e o endereço juntos usando um JOIN
        // A sintaxe 'enderecos(*)' instrui o Supabase a buscar todas as colunas
        // da tabela relacionada 'enderecos'.
        const { data: dadosDoPerfil, error: erroPerfil } = await supabase
            .from('perfis') // Tabela em português
            .select(`
                *,
                enderecos (*) 
            `) // Tabela relacionada em português
            .eq('id', user.id)
            .single();

        if (erroPerfil || !dadosDoPerfil) {
            console.error('Erro ao buscar perfil e endereço:', erroPerfil?.message);
            return res.status(404).json({ error: 'Perfil do usuário não encontrado.' });
        }

        // Os dados vêm aninhados. Vamos organizá-los para o cliente.
        const perfilCompletoUsuario = {
            ...dadosDoPerfil,
            email: user.email,
            endereco: dadosDoPerfil.enderecos, // Atribui o objeto de endereço aninhado
        };
        delete perfilCompletoUsuario.enderecos; // Limpa a propriedade aninhada original

        res.status(200).json(perfilCompletoUsuario);

    } catch (e) {
        console.error('Erro inesperado no endpoint /api/user/data:', e.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// Endpoint para completar o cadastro do usuário
profile.post('/api/user/complete-profile', protect.partially, async (req, res) => {
    const tokenDeAcesso = req.cookies['sb-access-token'];
    const { data: { user }, error: erroAuth } = await supabase.auth.getUser(tokenDeAcesso);

    if (erroAuth || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    const usuarioId = user.id;

    // Os nomes aqui (nome, nascimento, etc.) devem corresponder ao que o front-end envia no corpo da requisição
    const { nome, nascimento, telefone, cpf, endereco } = req.body;

    if (!nome || !nascimento || !telefone || !cpf || !endereco) {
        return res.status(400).json({ error: 'Todos os campos do formulário são obrigatórios.' });
    }

    // Insere primeiro na tabela 'perfis'
    const { error: erroPerfil } = await supabase
        .from('perfis') // Tabela em português
        .insert({
            id: usuarioId, // Usa o ID da tabela auth.users
            nome_completo: nome,
            data_nascimento: nascimento,
            telefone: telefone,
            cpf: cpf
        });

    if (erroPerfil) {
        console.error('Erro ao salvar perfil no Supabase:', erroPerfil.message);
        if (erroPerfil.code === '23505') { 
            return res.status(409).json({ error: 'O perfil para este usuário já existe.' });
        }
        return res.status(500).json({ error: 'Não foi possível salvar as informações do perfil.' });
    }

    // Se o perfil foi salvo com sucesso, insere na tabela 'enderecos'
    const { error: erroEndereco } = await supabase
        .from('enderecos') // Tabela em português
        .insert({
            perfil_id: usuarioId, // Link para o perfil que acabamos de criar
            rua: endereco.rua,
            numero: endereco.numero,
            complemento: endereco.complemento,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            cep: endereco.cep
        });

    if (erroEndereco) {
        console.error('Erro ao salvar endereço no Supabase:', erroEndereco.message);
        // Idealmente, você deveria deletar o perfil criado para evitar inconsistência
        return res.status(500).json({ error: 'Perfil salvo, mas não foi possível salvar o endereço.' });
    }
    
    // Opcional: Atualiza os metadados do usuário para conceder acesso total
    await supabase.auth.updateUser({
        data: { full_user_access: true }
    });

    res.status(201).json({ message: 'Cadastro finalizado com sucesso!' });
});

export default profile;