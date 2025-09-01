import express from 'express';
import { fileURLToPath } from 'url';
import path, { join } from 'path';

import protectRoute from '../middleware/protectRoute.js'

import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pageRouter = express();

pageRouter.use(express.json());
pageRouter.use(cookieParser()); // Essencial para ler os cookies de autenticação
pageRouter.use(express.static(join(__dirname, '../public')));

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
pageRouter.get('/perfil', protectRoute, (req, res) => res.render('perfil'));
pageRouter.get('/configuracoes', protectRoute, (req, res) => res.render('configuracoes'));
pageRouter.get('/historico', protectRoute, (req, res) => res.render('historico'));
pageRouter.get('/suporte-tecnico', protectRoute, (req, res) => res.render('suporte-tecnico'));
pageRouter.get('/avaliacao', protectRoute, (req, res) => res.render('avaliacao'));
pageRouter.get('/agendar-consulta', protectRoute, (req, res) => res.render('agendarConsulta'));
pageRouter.get('/hospital', protectRoute, (req, res) => res.render('hospital'));
pageRouter.get('/hospitais-cadastrados', protectRoute, (req, res) => res.render('hospitaisCadastrados'));
pageRouter.get('/hospitais-lotacao', protectRoute, (req, res) => res.render('hospitaisLotacao'));
pageRouter.get('/hospitais-procurados', protectRoute, (req, res) => res.render('hospitaisProcurados'));
pageRouter.get('/hospitais-proximos', protectRoute, (req, res) => res.render('hospitaisProximos'));
pageRouter.get('/teste-protegido', protectRoute, (req, res) => res.render('teste-protegido'));

export default pageRouter;