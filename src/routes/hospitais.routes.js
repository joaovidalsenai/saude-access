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
hospitais.get("/hospital", async (req, res) => {
  const hospitalId = req.query.id; // Pega o ID da URL, ex: /hospital?id=5

  if (!hospitalId) {
    return res.status(400).send("O ID do hospital é obrigatório.");
  }

  try {
    // Consulta que busca todos os dados do hospital e suas avaliações
    const { data: hospital, error } = await supabase
      .from("avaliacao")
      .select(`*, avaliacao_hospital(*)`)
      .eq("hospital_id", hospitalId)
      .single();

    if (error) throw error;

    if (!hospital) {
      return res.status(404).send("Hospital não encontrado.");
    }
    
    // Renderiza a página de detalhes (ex: 'hospital.ejs')
    res.render('hospital', { hospital: hospital });

  } catch (err) {
    console.error(`Erro ao buscar detalhes do hospital ID ${hospitalId}:`, err.message);
    res.status(500).send("Erro ao carregar a página de detalhes do hospital.");
  }
});

// Exporta o roteador com as novas rotas
export default hospitais;