import geocodingService, { getGeolocation, getAddressFromCoordinates } from './geocoding-service.js';
// Importe a função de criar rotas do seu outro módulo
import { createRoute } from './maps.routes.js';

// ========== EXEMPLOS DE USO ==========

async function exemploBasico() {
  console.log('=== Exemplo Básico ===');
  
  try {
    // Converte endereço para coordenadas
    const coordenadas = await getGeolocation('Av. Paulista, 1000, São Paulo, SP');
    console.log('Coordenadas:', coordenadas.coordinates);
    console.log('Endereço formatado:', coordenadas.formatted_address);
    
    // Converte coordenadas para endereço
    const endereco = await getAddressFromCoordinates(
      coordenadas.coordinates.latitude,
      coordenadas.coordinates.longitude
    );
    console.log('Endereço encontrado:', endereco.primary_address.formatted_address);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ... (suas outras funções de exemplo como exemploAvancado, exemploBatch, etc. permanecem aqui) ...

// ==========================================================
// === NOVA FUNÇÃO ADICIONADA ===============================
// ==========================================================
/**
 * Exemplo que combina geolocalização e criação de rota.
 */
async function exemploRotaComGeolocalizacao() {
  console.log('\n=== Exemplo: Rota a partir de Geolocalização ===');

  try {
    // 1. Obter as coordenadas da origem
    console.log('Buscando coordenadas da origem...');
    const dadosOrigem = await getGeolocation('Aeroporto de Congonhas, São Paulo, SP');
    const coordenadasOrigem = {
        lat: dadosOrigem.coordinates.latitude,
        lng: dadosOrigem.coordinates.longitude,
    };
    console.log(`Origem: ${dadosOrigem.formatted_address}`);

    // 2. Obter as coordenadas do destino
    console.log('Buscando coordenadas do destino...');
    const dadosDestino = await getGeolocation('Parque Ibirapuera, São Paulo, SP');
    const coordenadasDestino = {
        lat: dadosDestino.coordinates.latitude,
        lng: dadosDestino.coordinates.longitude,
    };
    console.log(`Destino: ${dadosDestino.formatted_address}`);

    // 3. Usar as coordenadas para criar a rota
    console.log('Criando a rota...');
    const rota = await createRoute(coordenadasOrigem, coordenadasDestino);

    const melhorRota = rota.best_route;
    console.log('\n--- Rota Calculada ---');
    console.log(`De: ${melhorRota.start_address}`);
    console.log(`Para: ${melhorRota.end_address}`);
    console.log(`Distância: ${melhorRota.distance.text}`);
    console.log(`Duração: ${melhorRota.duration.text}`);

  } catch (error) {
    console.error('Erro ao criar rota com geolocalização:', error.message);
  }
}


async function exemploCompleto() {
  console.log('=== EXECUTANDO TODOS OS EXEMPLOS ===');
  
  await exemploBasico();
  // await exemploAvancado();
  // await exemploBatch();
  // await exemploDistancia();
  // await exemploTratamentoErros();
  await exemploRotaComGeolocalizacao(); // Adicionamos a nova função à execução
  
  console.log('\n=== FIM DOS EXEMPLOS ===');
}

// ... (o restante do seu arquivo, como buscarEnderecoProximo e validarEndereco) ...


// Exporta as funções de exemplo e utilitários
export default {
  exemploCompleto,
  buscarEnderecoProximo,
  validarEndereco,
  exemploRotaComGeolocalizacao // Exporta a nova função
};

// Executa os exemplos se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  exemploCompleto().catch(console.error);
}