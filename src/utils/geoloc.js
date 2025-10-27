// pages.routes.js

// ... (outros imports)

// --- INÍCIO: FUNÇÕES AUXILIARES DE DISTÂNCIA ---

/**
 * Converte graus para radianos
 */
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calcula a distância em linha reta entre duas coordenadas (Fórmula Haversine)
 * Retorna a distância em quilômetros (km).
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  // Se alguma coordenada estiver faltando, retorna "infinito"
  // para que esses hospitais fiquem no final da lista.
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return Infinity;
  }

  const R = 6371; // Raio da Terra em km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distância em km
  return d;
}
// --- FIM: FUNÇÕES AUXILIARES DE DISTÂNCIA ---


// ... (suas outras rotas, como /historico, /hospital, etc.)
export { deg2rad, getDistanceFromLatLonInKm };