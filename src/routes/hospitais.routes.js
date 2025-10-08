import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Router } from 'express';

dotenv.config();

// Renomeamos a variável do roteador para maior clareza
const hospitais = Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// -----------------------------------------------------------------------------
// ROTA #1: API que fornece a LISTA de hospitais
// Endereço antigo: /api/showH
// NOVO ENDEREÇO: /api/hospitais
// -----------------------------------------------------------------------------
hospitais.get("/api/hospitais", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("hospital")
      .select("hospital_id, hospital_nome");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Erro na API /api/hospitais:", err.message);
    res.status(500).json({ erro: "Falha ao buscar a lista de hospitais." });
  }
});

// -----------------------------------------------------------------------------
// ROTA #2: Rota para renderizar a PÁGINA da LISTA de hospitais
// Endereço antigo: /showH
// NOVO ENDEREÇO: /hospitais
// -----------------------------------------------------------------------------
hospitais.get("/hospitais", (req, res) => {
  // Esta rota apenas renderiza a página da lista.
  res.render('showH', { titulo: 'Hospitais Próximos' });
});

// -----------------------------------------------------------------------------
// ROTA #3: Rota para renderizar a PÁGINA de DETALHES de um hospital
// Endereço antigo: /showH (com conflito)
// NOVO ENDEREÇO: /hospital
// -----------------------------------------------------------------------------

// Dentro de pages.routes.js
hospitais.get('/hospital', (req, res) => {
  try {
    const { id } = req.query; // Pega o id=23 da URL

    // PROVAVELMENTE HÁ UMA VALIDAÇÃO AQUI:
    // Exemplo: O código pode estar esperando algo diferente
    if (!id || typeof id !== 'string' || id.trim() === '') {
      // SE A VALIDAÇÃO FALHAR, ELE ENVIA O ERRO 400
      return res.status(400).render('error'); // <- Este é o gatilho
    }

    // ... resto do seu código para buscar o hospital ...
    res.render('hospital', { hospitalData });

  } catch (error) {
    res.status(500).render('error');
  }
});

// Exporta o roteador com as novas rotas
export default hospitais;