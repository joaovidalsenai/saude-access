import express from 'express';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import protect from '../middlewares/protect.route.js';
import formatar from '../utils/formatar.js';
import dadosUsuario, { AuthError, NotFoundError } from '../middlewares/dadosUsuario.js';
import cookieParser from 'cookie-parser';
import supabase from '../db/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pages = express();

pages.use(express.json());
pages.use(cookieParser()); // Essencial para ler os cookies de autenticação
pages.use(express.static(join(__dirname, '../public')));

// Configure EJS as view engine
pages.set('view engine', 'ejs');
pages.set('views', join(__dirname, '..', 'views'));

// ===== ROTAS PÚBLICAS =====
pages.get('/', (req, res) => res.render('index'));
pages.get('/login', (req, res) => res.render('login'));
pages.get('/cadastro', (req, res) => res.render('cadastro'));
// ... (suas outras rotas públicas)

// ===== ROTAS PROTEGIDAS =====
// O middleware 'protect.entirely' é aplicado a cada rota que precisa de login
pages.get('/inicio', protect.entirely, (req, res) => res.render('inicio'));

pages.get('/perfil', protect.entirely, async (req, res) => {
    try {
        const tokenDeAcesso = req.cookies['sb-access-token'];
        const rawUserProfile = await dadosUsuario(tokenDeAcesso); // Chama o serviço

        const userProfile = {
          nome: formatar.nome(rawUserProfile.cliente_nome),
          cpf: formatar.cpf(rawUserProfile.cliente_cpf),
          telefone: formatar.telefone(rawUserProfile.cliente_telefone),
          data_nascimento: formatar.data(rawUserProfile.cliente_nascimento),
          email: rawUserProfile.email,
          logradouro: rawUserProfile.endereco.endereco_logradouro,
          numero: rawUserProfile.endereco.endereco_numero,
          complemento: rawUserProfile.endereco.endereco_complemento || false,
          bairro: rawUserProfile.endereco.endereco_bairro,
          cidade: rawUserProfile.endereco.endereco_cidade,
          estado: rawUserProfile.endereco.endereco_estado,
          cep: formatar.cep(rawUserProfile.endereco.endereco_cep)
        }

        // Se chegou aqui, os dados foram encontrados com sucesso
        res.render('perfil', { user: userProfile });

    } catch (e) {
        // Agora tratamos os erros específicos lançados pelo serviço
        if (e instanceof NotFoundError) {
            // Se o perfil não existe, o usuário precisa completar o cadastro
            return res.redirect('/cadastro/info');
        }
        if (e instanceof AuthError) {
            // Se o token é inválido ou ausente, manda para o login
            return res.redirect('/login');
        }

        // Para qualquer outro erro inesperado
        console.error('Erro ao carregar a página de perfil:', e.message);
        res.redirect('/inicio');
    }
});

pages.get('/configuracoes', protect.entirely, (req, res) => res.render('configuracoes'));

pages.get('/historico', protect.entirely, async (req, res) => {
    try {
        const userId = req.user.id; // Pega o ID do usuário logado

        // 1. Busca no Supabase todas as avaliações feitas pelo usuário
        // e traz junto o nome e o ID do hospital relacionado
        const { data: avaliacoes, error } = await supabase
            .from('avaliacao_hospital')
            .select(`
                avaliacao_data,
                avaliacao_lotacao,
                avaliacao_tempo_espera,
                avaliacao_atendimento,
                avaliacao_infraestrutura,
                hospital ( hospital_id, hospital_nome )
            `)
            .eq('cliente_id', userId)
            .order('avaliacao_data', { ascending: false }); // Ordena pela data, mais recentes primeiro

        if (error) {
            console.error('Erro ao buscar histórico de avaliações:', error.message);
            return res.status(500).send('Não foi possível carregar seu histórico.');
        }

        // 2. Formata os dados para facilitar a exibição na página
        const avaliacoesFormatadas = avaliacoes.map(review => {
            const media = (
                review.avaliacao_lotacao +
                review.avaliacao_tempo_espera +
                review.avaliacao_atendimento +
                review.avaliacao_infraestrutura
            ) / 4;

            return {
                ...review,
                media: media.toFixed(1), // Calcula a média daquela avaliação específica
                data_formatada: new Date(review.avaliacao_data).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }) // Formata a data para o padrão brasileiro
            };
        });

        // 3. Renderiza a nova página EJS com os dados formatados
        res.render('historico', {
            titulo: 'Meu Histórico de Avaliações',
            avaliacoes: avaliacoesFormatadas
        });

    } catch (err) {
        console.error('Erro inesperado na rota /historico:', err.message);
        res.status(500).send('Ocorreu um erro inesperado.');
    }
});

pages.get('/suporte', protect.entirely, (req, res) => res.render('suporteTecnico'));
pages.get('/agendar-consulta', protect.entirely, (req, res) => res.render('agendarConsulta'));

pages.get('/hospital', protect.entirely, async (req, res) => {
    try {
        const hospitalId = req.query.id;

        if (!hospitalId) {
            return res.status(400).render('error', {
                message: 'O ID do hospital é obrigatório.'
            });
        }

        // 1. Mantenha sua consulta principal para os dados do hospital
        const { data: hospitalData, error } = await supabase
            .from('hospital')
            .select(`
                *,
                hospital_endereco(*),
                hospital_contato(*),
                avaliacao_hospital(*)
            `)
            .eq('hospital_id', hospitalId)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(404).render('error', {
                message: 'Hospital não encontrado'
            });
        }
        
        // =======================================================
        // NOVA ADIÇÃO: Buscar os alertas de especialidade
        // =======================================================
        const { data: alertas, error: erroAlertas } = await supabase
            .from('vw_alertas_especialidade')
            .select('*')
            .eq('hospital_id', hospitalId);
        
        if (erroAlertas) {
            console.error('Erro ao buscar alertas:', erroAlertas.message);
            // Mesmo com erro nos alertas, a página ainda pode carregar.
            // Apenas teremos um array vazio de alertas.
        }
        // =======================================================
        // FIM DA NOVA ADIÇÃO
        // =======================================================


        // Todo o seu cálculo de médias e ordenação continua igual
        const avaliacoes = hospitalData.avaliacao_hospital || [];
        
        let ratingStats = null;
        if (avaliacoes.length > 0) {
            const media_lotacao = (avaliacoes.reduce((sum, a) => sum + a.avaliacao_lotacao, 0) / avaliacoes.length);
            const media_tempo_espera = (avaliacoes.reduce((sum, a) => sum + a.avaliacao_tempo_espera, 0) / avaliacoes.length);
            const media_atendimento = (avaliacoes.reduce((sum, a) => sum + a.avaliacao_atendimento, 0) / avaliacoes.length);
            const media_infraestrutura = (avaliacoes.reduce((sum, a) => sum + a.avaliacao_infraestrutura, 0) / avaliacoes.length);
            
            ratingStats = {
                total_avaliacoes: avaliacoes.length,
                media_lotacao,
                media_tempo_espera,
                media_atendimento,
                media_infraestrutura,
                media_geral: (media_lotacao + media_tempo_espera + media_atendimento + media_infraestrutura) / 4
            };
        }

        const recentRatings = avaliacoes
            .sort((a, b) => new Date(b.avaliacao_data) - new Date(a.avaliacao_data));

        
        const templateData = {
            hospital: {
                hospital_id: hospitalData.hospital_id,
                hospital_nome: hospitalData.hospital_nome,
                hospital_cnpj: hospitalData.hospital_cnpj
            },
            address: hospitalData.hospital_endereco[0] || {},
            hospital_email: hospitalData.hospital_contato[0].hospital_email || {},
            hospital_telefone: formatar.telefone(hospitalData.hospital_contato[0].hospital_telefone) || {},
            hospital_site: hospitalData.hospital_contato[0].hospital_site || {},
            ratings: {
                stats: ratingStats,
                recent: recentRatings
            },
            // NOVA ADIÇÃO: Passe a lista de alertas para o template
            alertas: alertas || [] 
        };

        res.render('hospital', templateData);

    } catch (error) {
        console.error('Error fetching hospital data:', error);
        res.status(500).render('error', {
            message: 'Erro interno do servidor'
        });
    }
});

pages.get('/hospital/avaliacao', protect.entirely, async (req, res) => {
    try {
        const hospitalId = req.query.id;

        if (!hospitalId) {
            return res.status(400).render('error', { 
                message: 'O ID do hospital é obrigatório.' 
            });
        }
        
        // Consulta atualizada para buscar o nome do hospital E suas especialidades
        // O Supabase faz o "join" automaticamente baseado nas suas chaves estrangeiras
        const { data: hospitalData, error } = await supabase
            .from('hospital')
            .select(`
                hospital_nome,
                hospital_especialidade (
                    especialidade (
                        especialidade_id,
                        especialidade_nome
                    )
                )
            `)
            .eq('hospital_id', hospitalId)
            .single();
        
        if (error || !hospitalData) {
            console.error('Supabase error:', error);
            return res.status(404).render('error', { 
                message: 'Hospital não encontrado' 
            });
        }

        // Mapeia os resultados para um formato mais simples para o EJS
        const especialidades = hospitalData.hospital_especialidade.map(item => {
            return item.especialidade;
        });
     
        // Renderiza a página passando nome, id e a nova lista de especialidades
        res.render('avaliacao', { 
            hospital_nome: hospitalData.hospital_nome, 
            hospital_id: hospitalId,
            especialidades: especialidades // <-- Nova variável aqui
        });

    } catch (error) {
        console.error('Error fetching hospital data:', error);
        res.status(500).render('error', { 
            message: 'Erro interno do servidor' 
        });
    }
});

pages.get('/hospitais', protect.entirely, async (req, res) => {
    // Opções de ordenação: 'alfabetica', 'media_geral', 'lotacao', 'tempo_espera', 'atendimento', 'infraestrutura'
    const ordenarPor = req.query.ordenar || 'alfabetica'; 

    try {
        // 1. Busca todos os hospitais e suas respectivas avaliações
        const { data: hospitais, error } = await supabase
            .from('hospital')
            .select(`
                hospital_id,
                hospital_nome,
                avaliacao_hospital (
                    avaliacao_lotacao,
                    avaliacao_tempo_espera,
                    avaliacao_atendimento,
                    avaliacao_infraestrutura
                )
            `);

        if (error) {
            console.error('Erro ao buscar hospitais e avaliações:', error.message);
            return res.status(500).send('Não foi possível carregar os hospitais.');
        }

        // 2. Calcula as médias para cada hospital
        const hospitaisComMedias = hospitais.map(h => {
            const avaliacoes = h.avaliacao_hospital;
            let medias = {
                media_lotacao: 0,
                media_tempo_espera: 0,
                media_atendimento: 0,
                media_infraestrutura: 0,
                media_geral: 0
            };

            if (avaliacoes && avaliacoes.length > 0) {
                const total = avaliacoes.length;
                medias.media_lotacao = avaliacoes.reduce((sum, a) => sum + a.avaliacao_lotacao, 0) / total;
                medias.media_tempo_espera = avaliacoes.reduce((sum, a) => sum + a.avaliacao_tempo_espera, 0) / total;
                medias.media_atendimento = avaliacoes.reduce((sum, a) => sum + a.avaliacao_atendimento, 0) / total;
                medias.media_infraestrutura = avaliacoes.reduce((sum, a) => sum + a.avaliacao_infraestrutura, 0) / total;
                medias.media_geral = (medias.media_lotacao + medias.media_tempo_espera + medias.media_atendimento + medias.media_infraestrutura) / 4;
            }

            return {
                id: h.hospital_id,
                nome: h.hospital_nome,
                ...medias
            };
        });

        // 3. Define o título da página e a chave de ordenação
        let titulo = 'Hospitais Cadastrados';
        let sortKey = 'nome'; // Default sort key

        switch (ordenarPor) {
            case 'media_geral':
                titulo = 'Hospitais por Média Geral';
                sortKey = 'media_geral';
                break;
            case 'lotacao':
                titulo = 'Hospitais por Lotação';
                sortKey = 'media_lotacao';
                break;
            case 'tempo_espera':
                titulo = 'Hospitais por Tempo de Espera';
                sortKey = 'media_tempo_espera';
                break;
            case 'atendimento':
                titulo = 'Hospitais por Atendimento';
                sortKey = 'media_atendimento';
                break;
            case 'infraestrutura':
                titulo = 'Hospitais por Infraestrutura';
                sortKey = 'media_infraestrutura';
                break;
        }

        // 4. Ordena a lista de hospitais
        hospitaisComMedias.sort((a, b) => {
            if (ordenarPor === 'alfabetica') {
                return a.nome.localeCompare(b.nome); // Ordem alfabética
            }
            // Para todos os outros casos, ordena pela nota (do maior para o menor)
            return b[sortKey] - a[sortKey];
        });

        // 5. Formata os dados para o EJS (COM A CORREÇÃO)
        const hospitaisFormatados = hospitaisComMedias.map(h => {
            // **A CORREÇÃO ESTÁ AQUI**
            // Se a ordenação for alfabética, a nota exibida é a média geral.
            // Caso contrário, é a nota do critério de ordenação.
            const notaParaExibir = (ordenarPor === 'alfabetica') ? h.media_geral : h[sortKey];
            
            return {
                id: h.id,
                nome: h.nome,
                nota: parseFloat(notaParaExibir).toFixed(1)
            };
        });

        // 6. Renderiza a página
        res.render('hospitais', {
            titulo,
            hospitais: hospitaisFormatados
        });

    } catch (err) {
        console.error('Erro inesperado na rota /hospitais:', err.message);
        res.status(500).send('Ocorreu um erro inesperado.');
    }
});

pages.get('/api/hospitais/buscar', protect.entirely, async (req, res) => {
    const { termo } = req.query; // Pega o termo de busca da URL, ex: /api/hospitais/buscar?termo=santa

    if (!termo || termo.trim().length < 2) {
        // Se não houver termo ou for muito curto, retorna um array vazio
        return res.json([]);
    }

    try {
        // Usamos .ilike() para uma busca "case-insensitive" que contenha o termo
        const { data, error } = await supabase
            .from('hospital')
            .select('hospital_id, hospital_nome')
            .ilike('hospital_nome', `%${termo}%`) // O '%' é um coringa que busca qualquer correspondência
            .limit(10); // Limita a 10 resultados para não sobrecarregar

        if (error) {
            console.error('Erro na busca de hospitais:', error.message);
            return res.status(500).json({ message: 'Erro ao buscar hospitais.' });
        }

        res.json(data); // Retorna a lista de hospitais encontrados em formato JSON

    } catch (err) {
        console.error('Erro inesperado na rota /api/hospitais/buscar:', err.message);
        res.status(500).json({ message: 'Ocorreu um erro inesperado.' });
    }
});

pages.get('/cadastro/info', protect.partially, (req, res) => res.render('cadastroInfo'));

export default pages;