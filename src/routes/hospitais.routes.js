// src/routes/hospitais.routes.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Router } from 'express';
import { Client } from '@googlemaps/google-maps-services-js';

dotenv.config();
const hospitais = Router();

// --- Configuração do Supabase ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Cliente Google Maps ---
const googleMapsClient = new Client({});

// ============================================================================
// ROTA 1 → Página de listagem de hospitais
// ============================================================================
hospitais.get('/hospitais', (req, res) => {
  res.render('hospitais', { titulo: 'Hospitais Cadastrados' });
});

// ============================================================================
// ROTA 2 → Página de detalhes de um hospital
// ============================================================================
hospitais.get('/hospital', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).render('error', { message: 'ID do hospital não fornecido.' });

    const [hospitalRes, addressRes] = await Promise.all([
      supabase.from('hospital').select('*').eq('hospital_id', id).single(),
      supabase.from('hospital_endereco').select('*').eq('hospital_id', id).single()
    ]);

    if (hospitalRes.error || addressRes.error) {
      throw new Error('Hospital não encontrado ou endereço ausente.');
    }

    res.render('hospital', {
      hospital: hospitalRes.data,
      address: addressRes.data,
      ratings: null,
      alertas: [],
      hospital_telefone: hospitalRes.data.hospital_telefone || 'N/A',
      hospital_email: hospitalRes.data.hospital_email || 'N/A'
    });
  } catch (error) {
    console.error('Erro em /hospital:', error);
    res.status(500).render('error', { message: error.message });
  }
});

// ============================================================================
// ROTA 3 → API de cálculo de distâncias (corrigida e compatível)
// ============================================================================
// ROTA: /hospitais/proximos  (robusta, usa destinosInfo para manter ordem)
hospitais.get('/hospitais/proximos', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ erro: 'Parâmetros lat e lon obrigatórios.' });

  try {
    // 1) pega endereços
    const { data: enderecos, error: endError } = await supabase
      .from('hospital_endereco')
      .select('hospital_id, hospital_latitude, hospital_longitude');

    if (endError) throw endError;
    if (!enderecos || enderecos.length === 0) return res.status(404).json({ erro: 'Nenhum endereço encontrado.' });

    // 2) pega dados dos hospitais
    const { data: hospitaisData, error: hospError } = await supabase
      .from('hospital')
      .select('hospital_id, hospital_nome');

    if (hospError) throw hospError;

    // 3) monta destinos válidos e mantém referência ao hospital_id
    const destinosInfo = enderecos
      .map(e => {
        const latF = parseFloat(e.hospital_latitude);
        const lngF = parseFloat(e.hospital_longitude);
        if (!isNaN(latF) && !isNaN(lngF)) {
          return { hospital_id: e.hospital_id, lat: latF, lng: lngF };
        }
        return null;
      })
      .filter(Boolean);

    if (destinosInfo.length === 0) return res.status(404).json({ erro: 'Nenhuma coordenada válida encontrada.' });

    // 4) preparar payload para o Google (array de {lat,lng})
    const googleDestinations = destinosInfo.map(d => ({ lat: d.lat, lng: d.lng }));

    // 5) chamar Google Distance Matrix (tratando possíveis falhas)
    let matrixResponse = null;
    try {
      matrixResponse = await googleMapsClient.distancematrix({
        params: {
          origins: [{ lat: parseFloat(lat), lng: parseFloat(lon) }],
          destinations: googleDestinations,
          key: process.env.GOOGLE_MAPS_API_KEY,
          units: 'metric',
        },
      });
    } catch (gErr) {
      console.error('Google Distance Matrix error:', gErr && gErr.response ? gErr.response.data : gErr.message || gErr);
      matrixResponse = null;
    }

    // helpers para fallback Haversine
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371e3;
      const toRad = v => v * Math.PI / 180;
      const φ1 = toRad(lat1), φ2 = toRad(lat2);
      const Δφ = toRad(lat2 - lat1), Δλ = toRad(lng2 - lng1);
      const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    const formatDistance = m => m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`;
    const estimateTime = (m, mode='driving') => {
      const speed = mode === 'walking' ? 5 : 40;
      const mins = Math.round((m/1000)/speed * 60);
      if (mins < 60) return `${mins} min`;
      const hrs = Math.floor(mins/60), r = mins % 60;
      return r > 0 ? `${hrs}h ${r}min` : `${hrs}h`;
    };

    // 6) montar resultados usando destinosInfo (mesma ordem do request ao Google)
    let results = [];

    if (matrixResponse && matrixResponse.data && Array.isArray(matrixResponse.data.rows) && matrixResponse.data.rows.length > 0) {
      const elements = matrixResponse.data.rows[0].elements || [];
      results = destinosInfo.map((dest, idx) => {
        const el = elements[idx];
        const hosp = hospitaisData.find(h => String(h.hospital_id) === String(dest.hospital_id));
        if (!hosp) return null;

        if (el && el.status === 'OK' && el.distance && el.duration) {
          return {
            id: hosp.hospital_id,
            nome: hosp.hospital_nome,
            distancia_texto: el.distance.text,
            distancia_valor: el.distance.value,
            tempo_texto: el.duration.text
          };
        }

        // fallback local caso element não exista ou não esteja OK
        const d = haversine(parseFloat(lat), parseFloat(lon), dest.lat, dest.lng);
        return {
          id: hosp.hospital_id,
          nome: hosp.hospital_nome,
          distancia_texto: formatDistance(d),
          distancia_valor: Math.round(d),
          tempo_texto: estimateTime(d, 'driving')
        };
      }).filter(Boolean);
    } else {
      // fallback completo: Google falhou — usar Haversine para todos
      console.warn('Google Matrix sem rows — usando Haversine fallback.');
      results = destinosInfo.map(dest => {
        const hosp = hospitaisData.find(h => String(h.hospital_id) === String(dest.hospital_id));
        if (!hosp) return null;
        const d = haversine(parseFloat(lat), parseFloat(lon), dest.lat, dest.lng);
        return {
          id: hosp.hospital_id,
          nome: hosp.hospital_nome,
          distancia_texto: formatDistance(d),
          distancia_valor: Math.round(d),
          tempo_texto: estimateTime(d, 'driving')
        };
      }).filter(Boolean);
    }

    // 7) ordenar por distancia_valor
    results.sort((a,b) => a.distancia_valor - b.distancia_valor);
    return res.json(results);

  } catch (err) {
    console.error('Erro em /hospitais/proximos:', err);
    return res.status(500).json({ erro: 'Falha ao calcular distâncias.' });
  }
});

// ROTA: /hospitais/distancia  -> recebe originLat, originLng, destLat, destLng
hospitais.get('/hospitais/distancia', async (req, res) => {
  const { originLat, originLng, destLat, destLng } = req.query;
  if (!originLat || !originLng || !destLat || !destLng) {
    return res.status(400).json({ erro: 'Parâmetros originLat, originLng, destLat, destLng são obrigatórios.' });
  }

  try {
    let matrixResp = null;
    try {
      matrixResp = await googleMapsClient.distancematrix({
        params: {
          origins: [{ lat: parseFloat(originLat), lng: parseFloat(originLng) }],
          destinations: [{ lat: parseFloat(destLat), lng: parseFloat(destLng) }],
          key: process.env.GOOGLE_MAPS_API_KEY,
          units: 'metric'
        }
      });
    } catch (gErr) {
      console.error('Google DistanceMatrix single error:', gErr && gErr.response ? gErr.response.data : gErr.message || gErr);
      matrixResp = null;
    }

    // Fallback Haversine (mesma lógica do anterior)
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371e3;
      const toRad = v => v * Math.PI / 180;
      const φ1 = toRad(lat1), φ2 = toRad(lat2);
      const Δφ = toRad(lat2 - lat1), Δλ = toRad(lng2 - lng1);
      const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    const formatDistance = m => m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`;
    const estimateTime = (m, mode='driving') => {
      const speed = mode === 'walking' ? 5 : 40;
      const mins = Math.round((m/1000)/speed * 60);
      if (mins < 60) return `${mins} min`;
      const hrs = Math.floor(mins/60), r = mins % 60;
      return r > 0 ? `${hrs}h ${r}min` : `${hrs}h`;
    };

    if (matrixResp && matrixResp.data && Array.isArray(matrixResp.data.rows) && matrixResp.data.rows.length > 0) {
      const el = matrixResp.data.rows[0].elements[0];
      if (el && el.status === 'OK' && el.distance && el.duration) {
        return res.json({
          distancia: { valor: el.distance.value, texto: el.distance.text },
          duracao: { texto: el.duration.text }
        });
      }
    }

    // fallback
    const dist = haversine(parseFloat(originLat), parseFloat(originLng), parseFloat(destLat), parseFloat(destLng));
    return res.json({
      distancia: { valor: Math.round(dist), texto: formatDistance(dist) },
      duracao: { texto: estimateTime(dist, 'driving') }
    });

  } catch (err) {
    console.error('Erro em /hospitais/distancia:', err);
    return res.status(500).json({ erro: 'Erro ao obter distância' });
  }
});

export default hospitais;
