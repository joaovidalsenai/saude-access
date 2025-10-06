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


// script.js

// --- Elementos do HTML ---
// Seleciona os elementos da página com os quais vamos interagir
const textoLocalizacao = document.getElementById('minha-localizacao');
const inputDestinoLat = document.getElementById('destino-lat');
const inputDestinoLon = document.getElementById('destino-lon');
const divResultado = document.getElementById('resultado');

// --- Variáveis para guardar as coordenadas ---
let minhaLatitude = null;
let minhaLongitude = null;

// --- Função para chamar nossa API Backend ---
// A palavra 'async' indica que a função fará operações que podem demorar (como uma chamada de rede)
async function calcularDistanciaAPI() {
    // Verifica se já temos a localização do usuário e os dados do destino
    if (!minhaLatitude || !inputDestinoLat.value || !inputDestinoLon.value) {
        console.log("Aguardando todas as informações necessárias.");
        return;
    }

    // Mostra uma mensagem de "Calculando..." enquanto espera a resposta
    divResultado.innerHTML = `<p class="loading">Calculando...</p>`;

    // Formata as coordenadas como o Google API espera: "latitude,longitude"
    const origem = `${minhaLatitude},${minhaLongitude}`;
    const destino = `${inputDestinoLat.value},${inputDestinoLon.value}`;

    try {
        // Faz a requisição (chamada) para a nossa API em Python
        const response = await fetch('http://127.0.0.1:5000/calcular-distancia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Envia os dados de origem e destino no corpo da requisição
            body: JSON.stringify({ origem: origem, destino: destino })
        });

        // Converte a resposta da API para JSON
        const data = await response.json();

        // Verifica se a resposta foi bem-sucedida (status 200-299)
        if (response.ok) {
            // Atualiza o HTML com o resultado formatado
            divResultado.innerHTML = `
                <h3>Resultado do Cálculo:</h3>
                <p><strong>De:</strong> ${data.origem}</p>
                <p><strong>Para:</strong> ${data.destino}</p>
                <p><strong>Distância:</strong> ${data.distancia}</p>
                <p><strong>Tempo de Viagem (carro):</strong> ${data.duracao}</p>
            `;
        } else {
            // Mostra a mensagem de erro vinda da nossa API
            divResultado.innerHTML = `<p style="color: red;"><strong>Erro:</strong> ${data.erro}</p>`;
        }
    } catch (error) {
        // Lida com erros de conexão com a API (ex: servidor desligado)
        console.error('Erro ao chamar a API:', error);
        divResultado.innerHTML = `<p style="color: red;">Não foi possível conectar ao servidor. Verifique se a API Python está rodando.</p>`;
    }
}

// --- Função chamada quando a localização é obtida com sucesso ---
function sucessoNaLocalizacao(posicao) {
    const crd = posicao.coords;
    minhaLatitude = crd.latitude;
    minhaLongitude = crd.longitude;

    // Atualiza o texto na página
    textoLocalizacao.textContent = `Latitude: ${minhaLatitude.toFixed(4)}, Longitude: ${minhaLongitude.toFixed(4)}`;

    // Chama a função para calcular a distância assim que a primeira localização for obtida
    calcularDistanciaAPI();
}

// --- Função chamada em caso de erro ao obter a localização ---
function erroNaLocalizacao(err) {
    textoLocalizacao.textContent = `ERRO(${err.code}): ${err.message}`;
    textoLocalizacao.style.color = 'red';
}

// --- Ponto de Partida: Pede a localização ao usuário ---
// 'watchPosition' atualiza a localização continuamente quando o usuário se move
navigator.geolocation.watchPosition(sucessoNaLocalizacao, erroNaLocalizacao);



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