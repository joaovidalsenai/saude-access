import express from 'express';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import protect from '../middlewares/protectRoute.js';
import formatar from '../utils/formatar.js';

import cookieParser from 'cookie-parser';

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
        // 1. Obter o usuário autenticado a partir do cookie
        const accessToken = req.cookies['sb-access-token'];
        const { data: { user } } = await supabase.auth.getUser(accessToken);

        if (!user) {
            // Se não houver usuário, redireciona para o login
            return res.redirect('/login');
        }

        // 2. Buscar os dados do perfil na tabela 'profiles'
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(); // .single() para obter um único objeto

        if (error || !profile) {
            // Se o perfil não for encontrado, pode ser um erro ou o usuário ainda não completou o cadastro
            console.error('Perfil não encontrado:', error?.message);
            // Redireciona para a página de cadastro para completar as informações
            return res.redirect('/cadastroInfo');
        }
        
        // Adiciona o email do usuário ao objeto do perfil
        const userProfile = {
            ...profile,
            email: user.email 
        };

        // 3. Renderizar a página 'perfil.ejs' com os dados do usuário
        res.render('perfil', { user: userProfile });

    } catch (e) {
        console.error('Erro ao carregar a página de perfil:', e.message);
        res.redirect('/login');
    }
});
pages.get('/configuracoes', protect.entirely, (req, res) => res.render('configuracoes'));
pages.get('/historico', protect.entirely, (req, res) => res.render('hospitais', { titulo: "Histórico" , hospitais }));
pages.get('/suporte-tecnico', protect.entirely, (req, res) => res.render('suporte-tecnico'));
pages.get('/avaliacao', protect.entirely, (req, res) => res.render('avaliacao'));
pages.get('/agendar-consulta', protect.entirely, (req, res) => res.render('agendarConsulta'));
pages.get('/hospital', protect.entirely, (req, res) => res.render('hospital'));
pages.get('/hospitais', protect.entirely, (req, res) => {
  const ordenar = req.query.ordenar; // 'nota' ou undefined
  const titulo = ordenar === 'nota' ? 'Hospitais por Lotação' : 'Hospitais Cadastrados';

  // Cópia do array original
  let hospitaisOrdenados = hospitais.slice();

  // Ordenar por nota ou por nome (alfabética por padrão)
  if (ordenar === 'nota') {
    hospitaisOrdenados.sort((a, b) => b.nota - a.nota); // Maior nota primeiro
  } else {
    hospitaisOrdenados.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordem alfabética
  }

  res.render('hospitais', {
    titulo,
    hospitais: hospitaisOrdenados
  });
});
pages.get('/hospitais-procurados', protect.entirely, (req, res) => res.render('hospitaisLista', { titulo: "Hospitais Cadastrados" , hospitais }));
pages.get('/hospitais-proximos', protect.entirely, (req, res) => res.render('hospitaisLista', { titulo: "Hospitais Cadastrados" , hospitais }));

pages.get('/cadastrar-info', protect.partially, (req, res) => res.render('cadastroInfo'));

export default pages;