import express from 'express';
import { fileURLToPath } from 'url';
import path, { join } from 'path';

import protectRoute from '../middlewares/protectRoute.js'
import formatar from '../utils/formatar.js';

import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pageRouter = express();

pageRouter.use(express.json());
pageRouter.use(cookieParser()); // Essencial para ler os cookies de autenticação
pageRouter.use(express.static(join(__dirname, '../public')));

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
pageRouter.set('view engine', 'ejs');
pageRouter.set('views', join(__dirname, '..', 'views'));

// ===== ROTAS PÚBLICAS =====
pageRouter.get('/', (req, res) => res.render('index'));
pageRouter.get('/login', (req, res) => res.render('login'));
pageRouter.get('/cadastro', (req, res) => res.render('cadastro'));
// ... (suas outras rotas públicas)

// ===== ROTAS PROTEGIDAS =====
// O middleware 'protectRoute' é aplicado a cada rota que precisa de login
pageRouter.get('/inicio', protectRoute, (req, res) => res.render('inicio'));
pageRouter.get('/perfil', protectRoute, async (req, res) => {
    try {
        // 1. Get the access token from the browser's cookie.
        const accessToken = req.cookies['sb-access-token'];

        if (!accessToken) {
            return res.redirect('/login');
        }

        // 2. Construct the full URL to your internal API endpoint.
        const apiURL = `${req.protocol}://${req.get('host')}/api/user/data`;

        // 3. Call your own API using the native fetch API.
        const response = await fetch(apiURL, {
            method: 'GET',
            headers: {
                // Forward the cookie to authenticate the API request.
                'Cookie': `sb-access-token=${accessToken}`
            }
        });

        // 4. IMPORTANT: Manually check if the request was successful.
        // Unlike axios, fetch() does NOT throw an error for 4xx/5xx responses.
        if (!response.ok) {
            // If authentication failed at the API, redirect to login.
            if (response.status === 401) {
                return res.redirect('/login');
            }
            // For other server errors, throw an error to be caught by the catch block.
            throw new Error(`API returned with status: ${response.status}`);
        }

        // 5. If the response is OK, parse the JSON body.
        const userData = await response.json();
        const user =  { name: formatar.nome(userData.name) , email: userData.email , birth: formatar.dataISO(userData.birth) , cpf: formatar.cpf(userData.cpf) , phone: formatar.telefone(userData.phone) }
        // 6. Render the 'perfil.ejs' template with the data from the API.
        res.render('perfil', { user });
    } catch (error) {
        // This will catch network errors from fetch() or the error thrown above.
        console.error('Failed to load profile page:', error.message);
        res.status(500).send('An error occurred while loading the profile page.');
    }
});
pageRouter.get('/configuracoes', protectRoute, (req, res) => res.render('configuracoes'));
pageRouter.get('/historico', protectRoute, (req, res) => res.render('hospitais', { titulo: "Histórico" , hospitais }));
pageRouter.get('/suporte-tecnico', protectRoute, (req, res) => res.render('suporte-tecnico'));
pageRouter.get('/avaliacao', protectRoute, (req, res) => res.render('avaliacao'));
pageRouter.get('/agendar-consulta', protectRoute, (req, res) => res.render('agendarConsulta'));
pageRouter.get('/hospital', protectRoute, (req, res) => res.render('hospital'));
pageRouter.get('/hospitais', protectRoute, (req, res) => {
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
pageRouter.get('/hospitais-procurados', protectRoute, (req, res) => res.render('hospitaisLista', { titulo: "Hospitais Cadastrados" , hospitais }));
pageRouter.get('/hospitais-proximos', protectRoute, (req, res) => res.render('hospitaisLista', { titulo: "Hospitais Cadastrados" , hospitais }));

export default pageRouter;