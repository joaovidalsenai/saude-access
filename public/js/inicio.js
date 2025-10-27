/**
 * 1. Função Auxiliar "Promisified"
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
        // - Se der certo (1º callback), a Promise "resolve"
        // - Se der errado (2º callback), a Promise "rejeita"
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => reject(error)
        );
    });
}


/**
 * 2. Event Listener Principal (agora com 'async')
 * Marcamos o listener do DOMContentLoaded como 'async'
 * para que possamos usar 'await' dentro dele.
 */
document.addEventListener('DOMContentLoaded', async () => {

    let userLocation = null;
    let locationDenied = false;

    // 3. Bloco 'try...catch' com 'await'
    // O 'await' vai pausar a execução aqui até que a Promise
    // de 'getUserLocationPromise()' seja resolvida ou rejeitada.
    try {
        // Tenta obter a posição
        const position = await getUserLocationPromise();

        // SUCESSO: armazena as coordenadas
        userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        console.log("Localização obtida na página /inicio:", userLocation);

    } catch (error) {
        // FALHA: (usuário negou, não há suporte, etc.)
        locationDenied = true;
        console.warn("Não foi possível obter localização:", error.message);
    }

    // 4. Lógica dos Botões (Simplificada)
    // Este código SÓ RODA DEPOIS que o 'await' acima foi concluído.
    // Isso significa que não precisamos mais daquele "Caso 3" (de "aguarde...").
    // No momento em que o usuário clicar, nós JÁ SABEMOS se temos a
    // localização ou se ela foi negada.
    
    const filterButtons = document.querySelectorAll('.botao-filtro');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            let baseUrl = button.dataset.url;
            const isSortByDistance = baseUrl.includes('ordenar=distancia');

            // 4. Lógica de redirecionamento (agora mais simples)
            
            if (userLocation) {
                // CASO 1: TEMOS a localização.
                // Anexa a localização em TODOS os filtros e redireciona.
                window.location.href = `${baseUrl}&lat=${userLocation.lat}&lng=${userLocation.lng}`;
            
            } else if (locationDenied && isSortByDistance) {
                // CASO 2: O usuário NEGOU a permissão E está clicando em "Ordenar por Distância".
                // Exibe um alerta de erro.
                alert("Não foi possível obter sua localização. A ordenação por distância não está disponível. Por favor, libere a permissão de localização no seu navegador.");
            
            } else {
                // CASO 3: (Antigo Caso 4)
                // Outros filtros (alfabetica, media_geral)
                // ou se o usuário negou a localização para esses filtros,
                // apenas vai para a URL base sem a localização.
                window.location.href = baseUrl;
            }
        });
    });
});