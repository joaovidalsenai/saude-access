// ... (outros imports)

// --- INÍCIO: FUNÇÕES AUXILIARES DE DISTÂNCIA ---

// Constantes globais para evitar recálculo
const R = 6371; // Raio da Terra em km
const DEG_TO_RAD_FACTOR = Math.PI / 180;

/**
 * Converte graus para radianos
 */
function deg2rad(deg) {
  // Usa a constante pré-calculada
  return deg * DEG_TO_RAD_FACTOR;
}

/**
 * Calcula a distância em linha reta entre duas coordenadas (Fórmula Haversine)
 * Retorna a distância em quilômetros (km).
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  // Otimização 1: Correção de bug e validação de tipo.
  // A verificação anterior (!lat1) falhava para a coordenada 0 (ex: Linha do Equador).
  // Usar 'typeof' garante que 0 seja válido e que null/undefined/strings sejam rejeitados.
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
      typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return Infinity;
  }

  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  // Otimização 2: Armazena os valores de seno para evitar chamadas duplicadas.
  const sinDLatOver2 = Math.sin(dLat / 2);
  const sinDLonOver2 = Math.sin(dLon / 2);

  const a =
    sinDLatOver2 * sinDLatOver2 + // Mais rápido que Math.pow(sinDLatOver2, 2)
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    sinDLonOver2 * sinDLonOver2; // Mais rápido que Math.pow(sinDLonOver2, 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Otimização 3: Usa a constante R definida fora da função.
  const d = R * c; // Distância em km
  return d;
}
// --- FIM: FUNÇÕES AUXILIARES DE DISTÂNCIA ---


// ... (suas outras rotas, como /historico, /hospital, etc.)
export { deg2rad, getDistanceFromLatLonInKm };