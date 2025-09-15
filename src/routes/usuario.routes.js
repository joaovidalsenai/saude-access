import express from 'express';
import protect from '../middlewares/protect.route.js';
import supabase from "../db/supabase.js";

const usuario = express.Router();

// Endpoint para completar o cadastro do usuário
usuario.post('/usuario/completar', protect.partially, async (req, res) => {
    const tokenDeAcesso = req.cookies['sb-access-token'];
    const { data: { user }, error: erroAuth } = await supabase.auth.getUser(tokenDeAcesso);

    if (erroAuth || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }
    const perfilId = user.id;

    // Os nomes aqui (nome, nascimento, etc.) devem corresponder ao que o front-end envia no corpo da requisição
    const { nome, nascimento, telefone, cpf, endereco } = req.body;

    if (!nome || !nascimento || !telefone || !cpf || !endereco) {
        return res.status(400).json({ error: 'Todos os campos do formulário são obrigatórios.' });
    }

    // Insere primeiro na tabela 'perfis'
    const { error: erroPerfil } = await supabase
        .from('cliente') // Tabela em português
        .insert({
            cliente_id: perfilId, // Usa o ID da tabela auth.users
            cliente_nome: nome,
            cliente_nascimento: nascimento,
            cliente_telefone: telefone,
            cliente_cpf: cpf
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
        .from('cliente_endereco') // Tabela em português
        .insert({
            cliente_id: perfilId, // Link para o perfil que acabamos de criar
            endereco_logradouro: endereco.logradouro,
            endereco_numero: endereco.numero,
            endereco_complemento: endereco.complemento,
            endereco_bairro: endereco.bairro,
            endereco_cidade: endereco.cidade,
            endereco_estado: endereco.estado,
            endereco_cep: endereco.cep
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

export default usuario;