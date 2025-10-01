import express from "express";
import { createClient } from "@supabase/supabase-js";

const showH = express.Router();

// Inicialize o Supabase (verifique se suas variáveis de ambiente estão corretas)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// --- ROTA DA API ---
// OBJETIVO: Apenas retornar dados em formato JSON.
// Esta rota NÃO deve redirecionar para o login.
showH.get("/api/showH", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("HOSPITAL")
      .select(
        "HOSPITAL_ID, HOSPITAL_NOME"
      );

    if (error) {
      throw error;
    }
    
    // Responde com os dados puros em JSON
    res.json(data);

  } catch (err) {
    console.error("Erro na API /api/showH:", err.message);
    res.status(500).json({ erro: "Falha ao buscar dados dos hospitais." });
  }
});


// --- ROTAS DE PÁGINA ---

// OBJETIVO: Renderizar a PÁGINA da lista de hospitais.
showH.get("/showH", (req, res) => {
  // Esta rota apenas renderiza o arquivo EJS. O JavaScript dentro dele
  // será responsável por chamar a "/api/hospitais" para obter os dados.
  res.render('showH', { titulo: 'Hospitais Próximos' });
});

// OBJETIVO: Renderizar a PÁGINA de detalhes de um hospital específico.
showH.get("/showH", async (req, res) => {
  const hospitalId = req.query.id;

  if (!hospitalId) {
    return res.status(400).send("ID do hospital não foi fornecido.");
  }

  try {
    const { data: hospital, error } = await supabase
      .from("HOSPITAL")
      .select("*") // Pega todos os dados para a página de detalhes
      .eq("HOSPITAL_ID", hospitalId)
      .single(); // .single() para garantir que é um objeto, não um array

    if (error) {
      throw error;
    }

    if (!hospital) {
      return res.status(404).send("Hospital não encontrado.");
    }
    
    // Renderiza a página de detalhes, passando os dados do hospital para o EJS
    res.render('hospital', { hospital: hospital });

  } catch (err) {
    console.error("Erro ao buscar detalhes do hospital:", err.message);
    res.status(500).send("Erro ao carregar a página do hospital.");
  }
});

export default showW;