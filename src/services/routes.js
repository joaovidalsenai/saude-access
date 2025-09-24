import routingService, { 
  createRoute, 
  compareRoutes, 
  createMultiStopRoute,
  createOptimizedRoute,
  createDistanceMatrix 
} from './routing-service.js';

// ========== EXEMPLOS DE ROTAS ==========

async function exemploRotaBasica() {
  console.log('=== Rota Básica ===');
  
  try {
    const rota = await createRoute(
      'Av. Paulista, São Paulo, SP',
      'Cristo Redentor, Rio de Janeiro, RJ'
    );
    
    const melhorRota = rota.best_route;
    console.log(`De: ${melhorRota.start_address}`);
    console.log(`Para: ${melhorRota.end_address}`);
    console.log(`Distância: ${melhorRota.distance.text}`);
    console.log(`Duração: ${melhorRota.duration.text}`);
    
    if (melhorRota.duration_in_traffic) {
      console.log(`Com trânsito: ${melhorRota.duration_in_traffic.text}`);
    }
    
    console.log('\nPrimeiros 3 passos:');
    melhorRota.steps.slice(0, 3).forEach((step, index) => {
      console.log(`${index + 1}. ${step.instruction} (${step.distance})`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploComparacaoModais() {
  console.log('\n=== Comparação de Modais ===');
  
  try {
    const comparacao = await compareRoutes(
      'Marco Zero, Recife, PE',
      'Arena Fonte Nova, Salvador, BA',
      ['driving', 'transit'] // walking seria muito longo para essa distância
    );
    
    console.log(`De: ${comparacao.origin_formatted}`);
    console.log(`Para: ${comparacao.destination_formatted}\n`);
    
    Object.entries(comparacao.summary).forEach(([mode, data]) => {
      const modeName = {
        driving: 'Carro',
        walking: 'A pé', 
        transit: 'Transporte público',
        bicycling: 'Bicicleta'
      }[mode] || mode;
      
      console.log(`${modeName}:`);
      console.log(`  Distância: ${data.distance_km} km`);
      console.log(`  Tempo: ${data.duration_formatted}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploRotaMultiplasParadas() {
  console.log('\n=== Rota com Múltiplas Paradas ===');
  
  try {
    const locais = [
      'Aeroporto Internacional de São Paulo, Guarulhos, SP', // Início
      'Av. Paulista, São Paulo, SP',                        // Parada 1
      'Mercado Municipal, São Paulo, SP',                   // Parada 2
      'Estação da Luz, São Paulo, SP',                      // Parada 3
      'Shopping Ibirapuera, São Paulo, SP'                  // Fim
    ];
    
    const rota = await createMultiStopRoute(locais, {
      mode: 'driving',
      optimize_waypoints: true // Otimiza a ordem das paradas
    });
    
    const melhorRota = rota.best_route;
    console.log('Roteiro otimizado:');
    console.log(`Distância total: ${melhorRota.distance.text}`);
    console.log(`Tempo total: ${melhorRota.duration.text}\n`);
    
    // Se a rota foi otimizada, mostra a nova ordem
    if (rota.best_route.waypoint_order && rota.best_route.waypoint_order.length > 0) {
      console.log('Ordem otimizada das paradas:');
      console.log(`1. ${locais[0]} (início)`);
      rota.best_route.waypoint_order.forEach((order, index) => {
        console.log(`${index + 2}. ${locais[order + 1]}`);
      });
      console.log(`${locais.length}. ${locais[locais.length - 1]} (fim)`);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploRotaComOpcoes() {
  console.log('\n=== Rota com Opções Avançadas ===');
  
  try {
    const agora = Math.floor(Date.now() / 1000);
    
    const rota = await createRoute(
      'Barra da Tijuca, Rio de Janeiro, RJ',
      'Aeroporto Santos Dumont, Rio de Janeiro, RJ',
      {
        mode: 'driving',
        avoid: ['tolls'], // Evita pedágios
        departure_time: agora, // Saída agora para considerar trânsito
        traffic_model: 'pessimistic', // Cenário pessimista de trânsito
        alternatives: true // Busca rotas alternativas
      }
    );
    
    console.log(`Encontradas ${rota.routes.length} rota(s):\n`);
    
    rota.routes.forEach((route, index) => {
      console.log(`Rota ${index + 1}:`);
      console.log(`  Via: ${route.summary}`);
      console.log(`  Distância: ${route.distance.text}`);
      console.log(`  Tempo normal: ${route.duration.text}`);
      
      if (route.duration_in_traffic) {
        console.log(`  Com trânsito atual: ${route.duration_in_traffic.text}`);
      }
      
      if (route.warnings.length > 0) {
        console.log(`  Avisos: ${route.warnings.join(', ')}`);
      }
      console.log();
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploViagemOtimizada() {
  console.log('\n=== Viagem Otimizada (Caixeiro Viajante) ===');
  
  try {
    const pontoPartida = 'Copacabana, Rio de Janeiro, RJ';
    const pontosVisita = [
      'Pão de Açúcar, Rio de Janeiro, RJ',
      'Cristo Redentor, Rio de Janeiro, RJ', 
      'Maracanã, Rio de Janeiro, RJ',
      'Lagoa Rodrigo de Freitas, Rio de Janeiro, RJ',
      'Santa Teresa, Rio de Janeiro, RJ'
    ];
    
    const rotaOtimizada = await createOptimizedRoute(
      pontoPartida,
      pontosVisita,
      pontoPartida, // Volta ao ponto de partida
      { mode: 'driving' }
    );
    
    const rota = rotaOtimizada.best_route;
    console.log('Tour otimizado do Rio:');
    console.log(`Distância total: ${rota.distance.text}`);
    console.log(`Tempo total: ${rota.duration.text}\n`);
    
    console.log('Sequência otimizada:');
    console.log(`1. Partida: ${pontoPartida}`);
    
    if (rota.waypoint_order) {
      rota.waypoint_order.forEach((order, index) => {
        console.log(`${index + 2}. ${pontosVisita[order]}`);
      });
    }
    
    console.log(`${pontosVisita.length + 2}. Retorno: ${pontoPartida}`);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploMatrizDistancias() {
  console.log('\n=== Matriz de Distâncias ===');
  
  try {
    const origens = [
      'São Paulo, SP',
      'Rio de Janeiro, RJ',
      'Brasília, DF'
    ];
    
    const destinos = [
      'Salvador, BA',
      'Recife, PE', 
      'Porto Alegre, RS',
      'Manaus, AM'
    ];
    
    const matriz = await createDistanceMatrix(origens, destinos, {
      mode: 'driving'
    });
    
    console.log('Distâncias entre cidades (modo: carro)\n');
    
    matriz.matrix.forEach(origem => {
      console.log(`De ${origem.origin_formatted}:`);
      origem.destinations.forEach(destino => {
        if (destino.error) {
          console.log(`  → ${destino.destination}: ERRO - ${destino.error}`);
        } else {
          console.log(`  → ${destino.destination_formatted}: ${destino.distance.text} (${destino.duration.text})`);
        }
      });
      console.log();
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploRotaTransitoPublico() {
  console.log('\n=== Rota de Transporte Público ===');
  
  try {
    const amanha9h = new Date();
    amanha9h.setDate(amanha9h.getDate() + 1);
    amanha9h.setHours(9, 0, 0, 0);
    
    const rota = await createRoute(
      'Estação Sé, São Paulo, SP',
      'Aeroporto de Congonhas, São Paulo, SP',
      {
        mode: 'transit',
        departure_time: Math.floor(amanha9h.getTime() / 1000),
        transit_mode: ['subway', 'bus'] // Prefere metrô e ônibus
      }
    );
    
    const melhorRota = rota.best_route;
    console.log('Rota de transporte público:');
    console.log(`De: ${melhorRota.start_address}`);
    console.log(`Para: ${melhorRota.end_address}`);
    console.log(`Duração: ${melhorRota.duration.text}`);
    console.log(`Saída: ${new Date(amanha9h).toLocaleString('pt-BR')}\n`);
    
    console.log('Instruções detalhadas:');
    melhorRota.steps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.instruction}`);
      console.log(`   ${step.duration} - ${step.distance}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploRotaComCoordenadas() {
  console.log('\n=== Rota usando Coordenadas ===');
  
  try {
    const origem = { lat: -23.5505, lng: -46.6333 }; // São Paulo
    const destino = { lat: -22.9068, lng: -43.1729 }; // Rio de Janeiro
    
    const rota = await createRoute(origem, destino, {
      mode: 'driving'
    });
    
    const melhorRota = rota.best_route;
    console.log('Rota por coordenadas:');
    console.log(`Distância: ${melhorRota.distance.text}`);
    console.log(`Duração: ${melhorRota.duration.text}`);
    console.log(`Via: ${melhorRota.summary}`);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Função principal que executa todos os exemplos
async function exemploCompleto() {
  console.log('=== EXEMPLOS DE ROTAS GOOGLE MAPS ===\n');
  
  await exemploRotaBasica();
  await exemploComparacaoModais();
  await exemploRotaMultiplasParadas();
  await exemploRotaComOpcoes();
  await exemploViagemOtimizada();
  await exemploMatrizDistancias();
  await exemploTransitoPublico();
  await exemploRotaComCoordenadas();
  
  console.log('\n=== FIM DOS EXEMPLOS ===');
}

// ========== FUNÇÕES UTILITÁRIAS ==========

/**
 * Encontra a rota mais rápida entre múltiplas opções
 */
async function encontrarRotaMaisRapida(origem, destino, modos = ['driving', 'transit']) {
  try {
    const comparacao = await compareRoutes(origem, destino, modos);
    
    let melhorModo = null;
    let menorTempo = Infinity;
    
    Object.entries(comparacao.routes).forEach(([modo, rota]) => {
      if (!rota.error && rota.best_route) {
        const tempo = rota.best_route.duration.value;
        if (tempo < menorTempo) {
          menorTempo = tempo;
          melhorModo = modo;
        }
      }
    });
    
    return {
      melhor_modo: melhorModo,
      rota: comparacao.routes[melhorModo],
      todas_opcoes: comparacao.summary
    };
    
  } catch (error) {
    console.error('Erro ao encontrar melhor rota:', error.message);
    throw error;
  }
}

/**
 * Calcula custo estimado de combustível
 */
function calcularCustoCombustivel(rota, precoPorLitro = 5.50, consumoKmL = 12) {
  const distanciaKm = rota.best_route.distance.value / 1000;
  const litrosNecessarios = distanciaKm / consumoKmL;
  const custoTotal = litrosNecessarios * precoPorLitro;
  
  return {
    distancia_km: distanciaKm.toFixed(2),
    litros_necessarios: litrosNecessarios.toFixed(2),
    custo_estimado: custoTotal.toFixed(2),
    preco_por_litro: precoPorLitro,
    consumo_km_l: consumoKmL
  };
}

/**
 * Gera URL do Google Maps para visualizar rota
 */
function gerarUrlGoogleMaps(origem, destino, waypoints = []) {
  let url = `https://www.google.com/maps/dir/${encodeURIComponent(origem)}`;
  
  waypoints.forEach(waypoint => {
    url += `/${encodeURIComponent(waypoint)}`;
  });
  
  url += `/${encodeURIComponent(destino)}`;
  
  return url;
}

export { 
  exemploCompleto,
  encontrarRotaMaisRapida,
  calcularCustoCombustivel,
  gerarUrlGoogleMaps
};

// Executa exemplos se rodado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  exemploCompleto().catch(console.error);
}import routingService, { 
  createRoute, 
  compareRoutes, 
  createMultiStopRoute,
  createOptimizedRoute,
  createDistanceMatrix 
} from './routing-service.js';

// ========== EXEMPLOS DE ROTAS ==========

async function exemploRotaBasica() {
  console.log('=== Rota Básica ===');
  
  try {
    const rota = await createRoute(
      'Av. Paulista, São Paulo, SP',
      'Cristo Redentor, Rio de Janeiro, RJ'
    );
    
    const melhorRota = rota.best_route;
    console.log(`De: ${melhorRota.start_address}`);
    console.log(`Para: ${melhorRota.end_address}`);
    console.log(`Distância: ${melhorRota.distance.text}`);
    console.log(`Duração: ${melhorRota.duration.text}`);
    
    if (melhorRota.duration_in_traffic) {
      console.log(`Com trânsito: ${melhorRota.duration_in_traffic.text}`);
    }
    
    console.log('\nPrimeiros 3 passos:');
    melhorRota.steps.slice(0, 3).forEach((step, index) => {
      console.log(`${index + 1}. ${step.instruction} (${step.distance})`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploComparacaoModais() {
  console.log('\n=== Comparação de Modais ===');
  
  try {
    const comparacao = await compareRoutes(
      'Marco Zero, Recife, PE',
      'Arena Fonte Nova, Salvador, BA',
      ['driving', 'transit'] // walking seria muito longo para essa distância
    );
    
    console.log(`De: ${comparacao.origin_formatted}`);
    console.log(`Para: ${comparacao.destination_formatted}\n`);
    
    Object.entries(comparacao.summary).forEach(([mode, data]) => {
      const modeName = {
        driving: 'Carro',
        walking: 'A pé', 
        transit: 'Transporte público',
        bicycling: 'Bicicleta'
      }[mode] || mode;
      
      console.log(`${modeName}:`);
      console.log(`  Distância: ${data.distance_km} km`);
      console.log(`  Tempo: ${data.duration_formatted}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploRotaMultiplasParadas() {
  console.log('\n=== Rota com Múltiplas Paradas ===');
  
  try {
    const locais = [
      'Aeroporto Internacional de São Paulo, Guarulhos, SP', // Início
      'Av. Paulista, São Paulo, SP',                        // Parada 1
      'Mercado Municipal, São Paulo, SP',                   // Parada 2
      'Estação da Luz, São Paulo, SP',                      // Parada 3
      'Shopping Ibirapuera, São Paulo, SP'                  // Fim
    ];
    
    const rota = await createMultiStopRoute(locais, {
      mode: 'driving',
      optimize_waypoints: true // Otimiza a ordem das paradas
    });
    
    const melhorRota = rota.best_route;
    console.log('Roteiro otimizado:');
    console.log(`Distância total: ${melhorRota.distance.text}`);
    console.log(`Tempo total: ${melhorRota.duration.text}\n`);
    
    // Se a rota foi otimizada, mostra a nova ordem
    if (rota.best_route.waypoint_order && rota.best_route.waypoint_order.length > 0) {
      console.log('Ordem otimizada das paradas:');
      console.log(`1. ${locais[0]} (início)`);
      rota.best_route.waypoint_order.forEach((order, index) => {
        console.log(`${index + 2}. ${locais[order + 1]}`);
      });
      console.log(`${locais.length}. ${locais[locais.length - 1]} (fim)`);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploRotaComOpcoes() {
  console.log('\n=== Rota com Opções Avançadas ===');
  
  try {
    const agora = Math.floor(Date.now() / 1000);
    
    const rota = await createRoute(
      'Barra da Tijuca, Rio de Janeiro, RJ',
      'Aeroporto Santos Dumont, Rio de Janeiro, RJ',
      {
        mode: 'driving',
        avoid: ['tolls'], // Evita pedágios
        departure_time: agora, // Saída agora para considerar trânsito
        traffic_model: 'pessimistic', // Cenário pessimista de trânsito
        alternatives: true // Busca rotas alternativas
      }
    );
    
    console.log(`Encontradas ${rota.routes.length} rota(s):\n`);
    
    rota.routes.forEach((route, index) => {
      console.log(`Rota ${index + 1}:`);
      console.log(`  Via: ${route.summary}`);
      console.log(`  Distância: ${route.distance.text}`);
      console.log(`  Tempo normal: ${route.duration.text}`);
      
      if (route.duration_in_traffic) {
        console.log(`  Com trânsito atual: ${route.duration_in_traffic.text}`);
      }
      
      if (route.warnings.length > 0) {
        console.log(`  Avisos: ${route.warnings.join(', ')}`);
      }
      console.log();
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploViagemOtimizada() {
  console.log('\n=== Viagem Otimizada (Caixeiro Viajante) ===');
  
  try {
    const pontoPartida = 'Copacabana, Rio de Janeiro, RJ';
    const pontosVisita = [
      'Pão de Açúcar, Rio de Janeiro, RJ',
      'Cristo Redentor, Rio de Janeiro, RJ', 
      'Maracanã, Rio de Janeiro, RJ',
      'Lagoa Rodrigo de Freitas, Rio de Janeiro, RJ',
      'Santa Teresa, Rio de Janeiro, RJ'
    ];
    
    const rotaOtimizada = await createOptimizedRoute(
      pontoPartida,
      pontosVisita,
      pontoPartida, // Volta ao ponto de partida
      { mode: 'driving' }
    );
    
    const rota = rotaOtimizada.best_route;
    console.log('Tour otimizado do Rio:');
    console.log(`Distância total: ${rota.distance.text}`);
    console.log(`Tempo total: ${rota.duration.text}\n`);
    
    console.log('Sequência otimizada:');
    console.log(`1. Partida: ${pontoPartida}`);
    
    if (rota.waypoint_order) {
      rota.waypoint_order.forEach((order, index) => {
        console.log(`${index + 2}. ${pontosVisita[order]}`);
      });
    }
    
    console.log(`${pontosVisita.length + 2}. Retorno: ${pontoPartida}`);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploMatrizDistancias() {
  console.log('\n=== Matriz de Distâncias ===');
  
  try {
    const origens = [
      'São Paulo, SP',
      'Rio de Janeiro, RJ',
      'Brasília, DF'
    ];
    
    const destinos = [
      'Salvador, BA',
      'Recife, PE', 
      'Porto Alegre, RS',
      'Manaus, AM'
    ];
    
    const matriz = await createDistanceMatrix(origens, destinos, {
      mode: 'driving'
    });
    
    console.log('Distâncias entre cidades (modo: carro)\n');
    
    matriz.matrix.forEach(origem => {
      console.log(`De ${origem.origin_formatted}:`);
      origem.destinations.forEach(destino => {
        if (destino.error) {
          console.log(`  → ${destino.destination}: ERRO - ${destino.error}`);
        } else {
          console.log(`  → ${destino.destination_formatted}: ${destino.distance.text} (${destino.duration.text})`);
        }
      });
      console.log();
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploRotaTransitoPublico() {
  console.log('\n=== Rota de Transporte Público ===');
  
  try {
    const amanha9h = new Date();
    amanha9h.setDate(amanha9h.getDate() + 1);
    amanha9h.setHours(9, 0, 0, 0);
    
    const rota = await createRoute(
      'Estação Sé, São Paulo, SP',
      'Aeroporto de Congonhas, São Paulo, SP',
      {
        mode: 'transit',
        departure_time: Math.floor(amanha9h.getTime() / 1000),
        transit_mode: ['subway', 'bus'] // Prefere metrô e ônibus
      }
    );
    
    const melhorRota = rota.best_route;
    console.log('Rota de transporte público:');
    console.log(`De: ${melhorRota.start_address}`);
    console.log(`Para: ${melhorRota.end_address}`);
    console.log(`Duração: ${melhorRota.duration.text}`);
    console.log(`Saída: ${new Date(amanha9h).toLocaleString('pt-BR')}\n`);
    
    console.log('Instruções detalhadas:');
    melhorRota.steps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.instruction}`);
      console.log(`   ${step.duration} - ${step.distance}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function exemploRotaComCoordenadas() {
  console.log('\n=== Rota usando Coordenadas ===');
  
  try {
    const origem = { lat: -23.5505, lng: -46.6333 }; // São Paulo
    const destino = { lat: -22.9068, lng: -43.1729 }; // Rio de Janeiro
    
    const rota = await createRoute(origem, destino, {
      mode: 'driving'
    });
    
    const melhorRota = rota.best_route;
    console.log('Rota por coordenadas:');
    console.log(`Distância: ${melhorRota.distance.text}`);
    console.log(`Duração: ${melhorRota.duration.text}`);
    console.log(`Via: ${melhorRota.summary}`);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Função principal que executa todos os exemplos
async function exemploCompleto() {
  console.log('=== EXEMPLOS DE ROTAS GOOGLE MAPS ===\n');
  
  await exemploRotaBasica();
  await exemploComparacaoModais();
  await exemploRotaMultiplasParadas();
  await exemploRotaComOpcoes();
  await exemploViagemOtimizada();
  await exemploMatrizDistancias();
  await exemploTransitoPublico();
  await exemploRotaComCoordenadas();
  
  console.log('\n=== FIM DOS EXEMPLOS ===');
}

// ========== FUNÇÕES UTILITÁRIAS ==========

/**
 * Encontra a rota mais rápida entre múltiplas opções
 */
async function encontrarRotaMaisRapida(origem, destino, modos = ['driving', 'transit']) {
  try {
    const comparacao = await compareRoutes(origem, destino, modos);
    
    let melhorModo = null;
    let menorTempo = Infinity;
    
    Object.entries(comparacao.routes).forEach(([modo, rota]) => {
      if (!rota.error && rota.best_route) {
        const tempo = rota.best_route.duration.value;
        if (tempo < menorTempo) {
          menorTempo = tempo;
          melhorModo = modo;
        }
      }
    });
    
    return {
      melhor_modo: melhorModo,
      rota: comparacao.routes[melhorModo],
      todas_opcoes: comparacao.summary
    };
    
  } catch (error) {
    console.error('Erro ao encontrar melhor rota:', error.message);
    throw error;
  }
}

/**
 * Calcula custo estimado de combustível
 */
function calcularCustoCombustivel(rota, precoPorLitro = 5.50, consumoKmL = 12) {
  const distanciaKm = rota.best_route.distance.value / 1000;
  const litrosNecessarios = distanciaKm / consumoKmL;
  const custoTotal = litrosNecessarios * precoPorLitro;
  
  return {
    distancia_km: distanciaKm.toFixed(2),
    litros_necessarios: litrosNecessarios.toFixed(2),
    custo_estimado: custoTotal.toFixed(2),
    preco_por_litro: precoPorLitro,
    consumo_km_l: consumoKmL
  };
}

/**
 * Gera URL do Google Maps para visualizar rota
 */
function gerarUrlGoogleMaps(origem, destino, waypoints = []) {
  let url = `https://www.google.com/maps/dir/${encodeURIComponent(origem)}`;
  
  waypoints.forEach(waypoint => {
    url += `/${encodeURIComponent(waypoint)}`;
  });
  
  url += `/${encodeURIComponent(destino)}`;
  
  return url;
}

export { 
  exemploCompleto,
  encontrarRotaMaisRapida,
  calcularCustoCombustivel,
  gerarUrlGoogleMaps
};

// Executa exemplos se rodado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  exemploCompleto().catch(console.error);
}