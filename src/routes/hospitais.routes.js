// src/routes/hospitais.routes.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Router } from 'express';

dotenv.config();
const hospitais = Router();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { throw new Error('Credenciais Supabase em falta no .env'); }
const supabase = createClient(supabaseUrl, supabaseKey);

hospitais.get("/", async (req, res) => {
  try {
    console.log("-> Tentando buscar hospitais...");
    const { data: listaDeHospitais, error: hospitaisError } = await supabase.from('hospital').select('*, hospital_endereco(*)');
    if (hospitaisError) throw hospitaisError;
    console.log(`-> Encontrados ${listaDeHospitais.length} hospitais.`);

    console.log("-> Tentando buscar avaliações...");
    const { data: todasAvaliacoes, error: avaliacoesError } = await supabase.from('avaliacao_hospital').select('*');
    if (avaliacoesError) throw avaliacoesError;
    console.log(`-> Encontradas ${todasAvaliacoes.length} avaliações.`);

    console.log("-> Calculando médias...");
    const hospitaisComMedia = listaDeHospitais.map(hospital => {
      const avs = todasAvaliacoes.filter(ava => ava.hospital_id === hospital.hospital_id);
      let media = 0;
      if (avs.length > 0) {
        const soma = avs.reduce((acc, ava) => acc + (ava.avaliacao_lotacao + ava.avaliacao_tempo_espera + ava.avaliacao_atendimento) / 3.0, 0);
        media = soma / avs.length;
      }
      return { ...hospital, media_avaliacoes: media };
    });

    console.log("-> Renderizando a página com sucesso.");
    res.render('hospitais', {
      titulo: 'Hospitais Disponíveis',
      hospitais: hospitaisComMedia,
      erro: null
    });
  } catch (err) {
    // ESTA É A PARTE MAIS IMPORTANTE
    // Se algo falhar, o erro exato será enviado para a página
    console.error("!!! ERRO CAPTURADO NA ROTA /hospitais:", err);
    res.render('hospitais', {
      titulo: 'Erro ao Carregar Dados',
      hospitais: [], // Envia lista vazia em caso de erro
      erro: `Falha na comunicação com o banco de dados. Mensagem: ${err.message}`
    });
  }
});

hospitais.get("/detalhes", async (req, res) => {
    const hospitalId = req.query.id;
    if (!hospitalId) return res.status(400).send("ID do hospital obrigatório.");
    try {
        const { data: hospital, error } = await supabase.from("hospital").select(`*, hospital_endereco(*), avaliacao_hospital(*)`).eq("hospital_id", hospitalId).single();
        if (error) throw error;
        if (!hospital) return res.status(404).send("Hospital não encontrado.");
        hospital.avaliacao = hospital.avaliacao_hospital;
        res.render('hospital', { 
            titulo: hospital.hospital_nome,
            hospital: hospital 
        });
    } catch (err) {
        res.status(500).send(`Erro ao carregar detalhes: ${err.message}`);
    }
});
export default hospitais;

