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

const hospitais = [
  { nome: "Hospital São Rafael", nota: 9.2 },
  { nome: "Hospital Português", nota: 8.8 },
  { nome: "Hospital Geral do Estado (HGE)", nota: 8.5 },
  { nome: "Hospital Aliança", nota: 9.0 },
  { nome: "Hospital Santa Izabel", nota: 8.7 },
  { nome: "Hospital da Bahia", nota: 9.1 },
  { nome: "Hospital Roberto Santos", nota: 7.9 },
  { nome: "Hospital Jorge Valente", nota: 8.3 },
  { nome: "Hospital São Jorge", nota: 7.5 },
  { nome: "Hospital Salvador", nota: 8.6 }
];

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
          complemento: rawUserProfile.endereco.endereco_complemento || "NÃO INFORMADO",
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
pages.get('/historico', protect.entirely, (req, res) => res.render('hospitais', { titulo: "Histórico" , hospitais }));
pages.get('/suporte', protect.entirely, (req, res) => res.render('suporte-tecnico'));
pages.get('/avaliacao', protect.entirely, (req, res) => res.render('avaliacao'));
pages.get('/agendar-consulta', protect.entirely, (req, res) => res.render('agendarConsulta'));
pages.get('/hospital/:id', protect.entirely, (req, res) => res.render('hospital'));

pages.get('/hospitais', protect.entirely, async (req, res) => {
    const ordenar = req.query.ordenar; // 'nota' ou undefined
    const titulo = ordenar === 'nota' ? 'Hospitais por Lotação' : 'Hospitais Cadastrados';

    try {
        // 1. Chamar a função RPC criada no Supabase
        const { data: hospitais, error } = await supabase.rpc('get_hospitais_com_media_lotacao');

        // 2. Tratar possível erro na consulta
        if (error) {
            console.error('Erro ao buscar hospitais:', error.message);
            // Renderiza uma página de erro ou envia uma resposta de erro
            return res.status(500).send('Não foi possível carregar os hospitais.');
        }

        // 3. O 'data' já vem com 'id', 'nome' e 'nota', exatamente como o EJS espera.
        // A lógica de ordenação pode ser aplicada diretamente sobre o resultado.
        if (ordenar === 'nota') {
            hospitais.sort((a, b) => b.nota - a.nota); // Maior nota primeiro
        } else {
            hospitais.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordem alfabética
        }

        // Formata a nota para ter apenas uma casa decimal
        const hospitaisFormatados = hospitais.map(h => ({
            ...h,
            nota: parseFloat(h.nota).toFixed(1)
        }));

        // 4. Renderizar a página com os dados do banco
        res.render('hospitais', {
            titulo,
            hospitais: hospitaisFormatados // Usando a lista ordenada e formatada
        });

    } catch (err) {
        console.error('Erro inesperado na rota /hospitais:', err.message);
        res.status(500).send('Ocorreu um erro inesperado.');
    }
});

pages.get('/hospitais-procurados', protect.entirely, (req, res) => res.render('hospitaisLista', { titulo: "Hospitais Cadastrados" , hospitais }));
pages.get('/hospitais-proximos', protect.entirely, (req, res) => res.render('hospitaisLista', { titulo: "Hospitais Cadastrados" , hospitais }));

pages.get('/cadastro/info', protect.partially, (req, res) => res.render('cadastroInfo'));

export default pages;