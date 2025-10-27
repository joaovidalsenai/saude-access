/**
 * Constantes para o Cache
 */
const CACHED_LOCATION_KEY = 'userLocationCache'; // Chave no localStorage
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000; // 5 minutos em milissegundos

/**
 * 1. Função Auxiliar "Promisified" (Sem alterações)
 * Nós criamos uma nova função que retorna uma Promise
 * que resolve ou rejeita com base nos callbacks da API de geolocalização.
 */
function getUserLocationPromise() {
    // Primeiro, verifica se o navegador tem suporte
    if (!("geolocation" in navigator)) {
        // Se não tiver, já rejeita a Promise com um erro
        return Promise.reject(new Error("Geolocalização não é suportada por este navegador."));
    }

    // Retorna a nova Promise
    return new Promise((resolve, reject) => {
        // Chama a API original
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => reject(error),
            // Adiciona opções para melhor precisão (opcional, mas recomendado)
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 
        );
    });
}

/**
 * 2. NOVAS FUNÇÕES AUXILIARES DE CACHE
 */

/**
 * Salva a localização e o timestamp atual no localStorage.
 * @param {GeolocationPosition} position - O objeto de posição da API.
 */
function saveLocationToCache(position) {
    const locationData = {
        location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        },
        timestamp: Date.now() // Armazena a hora atual em milissegundos
    };

    try {
        localStorage.setItem(CACHED_LOCATION_KEY, JSON.stringify(locationData));
    } catch (e) {
        console.error("Não foi possível salvar a localização no cache.", e);
    }
}

/**
 * Tenta carregar a localização do localStorage.
 * Retorna a localização se ela existir e tiver menos de 5 minutos.
 * Retorna null em qualquer outro caso (sem cache, expirado, erro).
 */
function loadLocationFromCache() {
    try {
        const cachedDataJSON = localStorage.getItem(CACHED_LOCATION_KEY);
        if (!cachedDataJSON) {
            return null; // Nada no cache
        }

        const cachedData = JSON.parse(cachedDataJSON);
        const now = Date.now();
        const timeElapsed = now - cachedData.timestamp;

        if (timeElapsed < FIVE_MINUTES_IN_MS) {
            // Cache é válido e recente!
            console.log("Localização carregada do cache.");
            return cachedData.location; // Retorna apenas o objeto {lat, lng}
        } else {
            // Cache expirou
            console.log("Cache de localização expirado.");
            localStorage.removeItem(CACHED_LOCATION_KEY); // Limpa o cache antigo
            return null;
        }

    } catch (e) {
        console.error("Erro ao ler o cache de localização. Limpando...", e);
        // Se os dados estiverem corrompidos, limpa
        localStorage.removeItem(CACHED_LOCATION_KEY);
        return null;
    }
}


/**
 * 3. Event Listener Principal (Modificado com lógica de Cache)
 */
document.addEventListener('DOMContentLoaded', async () => {

    let userLocation = null;
    let locationDenied = false;

    // *** ETAPA 1: Tenta carregar do cache ***
    userLocation = loadLocationFromCache();

    // *** ETAPA 2: Se o cache falhar (nulo ou expirado), busca uma nova localização ***
    if (!userLocation) {
        console.log("Cache vazio ou expirado. Buscando nova localização...");

        // Bloco 'try...catch' com 'await'
        try {
            // Tenta obter a posição
            const position = await getUserLocationPromise();

            // SUCESSO: armazena as coordenadas
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // *** NOVO: Salva a nova localização no cache ***
            saveLocationToCache(position);
            
            console.log("Nova localização obtida e salva no cache:", userLocation);

        } catch (error) {
            // FALHA: (usuário negou, não há suporte, etc.)
            locationDenied = true;
            console.warn("Não foi possível obter localização:", error.message);
        }
    }

    // 4. Lógica dos Botões (Sem alterações)
    // Este código SÓ RODA DEPOIS que o 'await' (se necessário) foi concluído.
    // Nós JÁ SABEMOS se temos a localização (do cache ou nova) ou se ela foi negada.
    
    const filterButtons = document.querySelectorAll('.botao-filtro');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            let baseUrl = button.dataset.url;
            const isSortByDistance = baseUrl.includes('ordenar=distancia');

            // Lógica de redirecionamento
            
            if (userLocation) {
                // CASO 1: TEMOS a localização (do cache ou nova).
                window.location.href = `${baseUrl}&lat=${userLocation.lat}&lng=${userLocation.lng}`;
            
            } else if (locationDenied && isSortByDistance) {
                // CASO 2: O usuário NEGOU a permissão E está clicando em "Ordenar por Distância".
                alert("Não foi possível obter sua localização. A ordenação por distância não está disponível. Por favor, libere a permissão de localização no seu navegador.");
            
            } else {
                // CASO 3: Outros filtros sem localização.
                window.location.href = baseUrl;
            }
        });
    });
});