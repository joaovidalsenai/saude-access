// src/app.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { fileURLToPath } from 'url';
import path, { join } from 'path';

import pages from './routes/pages.routes.js';
import auth from './routes/auth.routes.js';
import perfil from './routes/perfil.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const alternativePORT = 3001;

// --- Middlewares ---
app.use(express.static(join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(pages);
app.use(auth);
app.use(perfil);

// ===== INICIALIZAÇÃO DO SERVIDOR =====
const PORT = process.env.PORT || alternativePORT;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});