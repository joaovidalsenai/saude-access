// src/app.js
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import pages from './routes/pages.routes.js';
import auth from './routes/auth.routes.js';
import usuario from './routes/usuario.routes.js';
import avaliacao from './routes/avaliar.routes.js';
import hospitais from './routes/hospitais.routes.js';
import geo from './routes/geo.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// --- CONFIGURAÇÃO ESSENCIAL ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));

// --- ROTAS (COM ORDEM ALTERADA PARA DIAGNÓSTICO) ---

// CORREÇÃO DECISIVA: O router de hospitais é registado ANTES do router de páginas.
// Isto garante que o pedido para /hospitais seja tratado primeiro pelo ficheiro correto.
app.use('/hospitais', hospitais);

app.use(pages);
app.use(auth);
app.use(usuario);
app.use(avaliacao);
app.use(geo);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});


