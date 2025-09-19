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

// Endpoint para reportar status de uma especialidade em um hospital
avaliacao.post('/avaliar/especialidade', protect.entirely, async (req, res) => {
    const tokenDeAcesso = req.cookies['sb-access-token'];
    const { data: { user }, error: erroAuth } = await supabase.auth.getUser(tokenDeAcesso);
    
    if (erroAuth || !user) {
        return res.status(401).json({ error: 'Usuário não autenticado. Apenas usuários logados podem reportar.' });
    }
    
    const clienteId = user.id;
    const { hospital_id, especialidade_id, especialidade_status, tempo_espera_estimado } = req.body;
    
    // Validação dos campos obrigatórios (mantida)
    if (!hospital_id || !especialidade_id || !especialidade_status) {
        return res.status(400).json({ 
            error: 'Campos obrigatórios: hospital_id, especialidade_id e especialidade_status.' 
        });
    }
    
    // Validação do status (mantida)
    const statusValidos = ['DISPONIVEL', 'EM_FALTA', 'LIMITADA'];
    if (!statusValidos.includes(especialidade_status)) {
        return res.status(400).json({ 
            error: `Status inválido. Use: ${statusValidos.join(', ')}` 
        });
    }
    
    // Verifica se a combinação hospital-especialidade existe (mantida, boa prática)
    const { data: hospitalEsp, error: erroConsulta } = await supabase
        .from('hospital_especialidade')
        .select('hospital_id') // Selecionar apenas um campo é suficiente
        .eq('hospital_id', hospital_id)
        .eq('especialidade_id', especialidade_id)
        .single();
    
    if (erroConsulta || !hospitalEsp) {
        return res.status(404).json({ 
            error: 'A especialidade especificada não está disponível neste hospital.' 
        });
    }
    
    // ========================================================================
    // REMOVIDO: Bloco de verificação de duplicidade manual.
    // O banco de dados agora cuida disso através da UNIQUE INDEX.
    // ========================================================================

    const novoReport = {
        cliente_id: clienteId,
        hospital_id: hospital_id,
        especialidade_id: especialidade_id,
        especialidade_status: especialidade_status,
        tempo_espera_estimado: tempo_espera_estimado || null
        // O campo 'avaliacao_data' usará o valor padrão do banco de dados (CURRENT_TIMESTAMP)
    };
    
    // Tenta inserir os dados diretamente
    const { error: erroInsert } = await supabase
        .from('avaliacao_especialidade')
        .insert(novoReport);
    
    if (erroInsert) {
        console.error('Erro ao salvar o report no Supabase:', erroInsert.message);
        
        // ADICIONADO: Captura do erro de violação de unicidade (código '23505')
        if (erroInsert.code === '23505') {
            return res.status(409).json({ // 409 Conflict é o status ideal para isso
                error: 'Você já reportou o status desta especialidade hoje. Tente novamente amanhã.' 
            });
        }

        if (erroInsert.code === '23503') { // Violação de chave estrangeira
            return res.status(404).json({ 
                error: 'Hospital, especialidade ou cliente especificado não existe.' 
            });
        }
        
        return res.status(500).json({ 
            error: 'Não foi possível registrar o status da especialidade.' 
        });
    }
    
    res.status(201).json({ 
        message: 'Status da especialidade reportado com sucesso!',
        dados: {
            hospital_id,
            especialidade_id,
            status: especialidade_status,
            tempo_espera: tempo_espera_estimado
        }
    });
});

export default avaliacao;