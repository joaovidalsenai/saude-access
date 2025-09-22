import express from "express";
import { createClient } from "@supabase/supabase-js";

const showH = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// --- Hospitais: mostra apenas capacidade e tempo de espera ---
showH.post("/hospitais", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("HOSPITAL")
      .select("HOSPITAL_CAPACIDADE_MAX, HOSPITAL_CAPACIDADE_ATUAL, HOSPITAL_TEMPO_ESPERA");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});


showH.post("/avaliacoes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("AVALIACAO_HOSPITAL")
      .select("AVALIACAO_LOTACAO, AVALIACAO_TEMPO_ESPERA, NOTA, AVALIACAO_INFRA");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default showH;