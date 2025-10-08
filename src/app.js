// src/app.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import geo from './routes/geo.routes.js';

import pages from './routes/pages.routes.js';
import auth from './routes/auth.routes.js';
import usuario from './routes/usuario.routes.js';
import avaliacao from './routes/avaliar.routes.js';
import hospitais from './routes/hospitais.routes.js';
import { GoogleMapsService } from './services/maps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const alternativePORT = 3001;


// --- Middlewares ---
app.use(express.static(join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(pages);
app.use(auth);
app.use(usuario);
app.use(avaliacao);
app.use(hospitais);
app.use(geo);


// ===== INICIALIZAÇÃO DO SERVIDOR =====
const PORT = process.env.PORT || alternativePORT;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

