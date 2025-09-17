import express from 'express';
import protect from '../middlewares/protect.route.js'; // Reutilizando o middleware de proteção
import supabase from "../db/supabase.js";

const avaliacao = express.Router();

// Endpoint para registrar a avaliação de um hospital
avaliacao.post('/avaliar/hospital', protect.entirely, async (req, res) => { // Usando um middleware de proteção mais forte, se aplicável
    const tokenDeAcesso = req.cookies['sb-access-token'];
    const { data: { user }, error: erroAuth } = await supabase.auth.getUser(tokenDeAcesso);

    if (erroAuth || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado. Apenas usuários logados podem avaliar.' });
    }
    const clienteId = user.id; // O ID do usuário autenticado será o CLIENTE_ID

    // Os dados da avaliação virão no corpo da requisição
    const { hospital_id, avaliacao_lotacao, avaliacao_tempo_espera, avaliacao_atendimento, avaliacao_infraestrutura } = req.body;

    // Validação dos campos obrigatórios
    if (hospital_id === undefined || avaliacao_lotacao === undefined || avaliacao_tempo_espera === undefined || avaliacao_atendimento === undefined || avaliacao_infraestrutura === undefined) {
        return res.status(400).json({ error: 'Todos os campos da avaliação são obrigatórios: hospital_id, avaliacao_lotacao, avaliacao_tempo_espera, avaliacao_atendimento e avaliacao_infraestrutura.' });
    }

    // Cria um objeto com os dados para inserir na tabela AVALIACAO_HOSPITAL
    const novaAvaliacao = {
        hospital_id: hospital_id,
        cliente_id: clienteId,
        avaliacao_lotacao: avaliacao_lotacao,
        avaliacao_tempo_espera: avaliacao_tempo_espera,
        avaliacao_atendimento: avaliacao_atendimento,
        avaliacao_infraestrutura: avaliacao_infraestrutura,
        avaliacao_data: new Date().toISOString() // Grava a data e hora atuais no formato UTC
    };

    // Insere os dados na tabela 'avaliacao_hospital'
    const { error: erroInsert } = await supabase
        .from('avaliacao_hospital')
        .insert(novaAvaliacao);

    if (erroInsert) {
        console.error('Erro ao salvar a avaliação no Supabase:', erroInsert.message);

        // Tratamento de erros específicos do banco de dados
        if (erroInsert.code === '23503') { // Foreign key violation
             return res.status(404).json({ error: 'O hospital ou o cliente especificado não existe.' });
        }
        
        return res.status(500).json({ error: 'Não foi possível registrar a sua avaliação.' });
    }

    // Se tudo correu bem, envia uma resposta de sucesso
    res.status(201).json({ message: 'Avaliação registrada com sucesso!' });
});

export default avaliacao;