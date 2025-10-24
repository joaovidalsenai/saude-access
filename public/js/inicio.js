// Espera o documento carregar completamente
document.addEventListener('DOMContentLoaded', () => {

    // Variável para armazenar a localização do usuário (latitude e longitude)
    let userLocation = null;
    // Variável para saber se o usuário já negou a permissão
    let locationDenied = false;

    // 1. Tenta obter a localização assim que a página 'inicio' carregar
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Sucesso: armazena as coordenadas
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log("Localização obtida na página /inicio:", userLocation);
            },
            (error) => {
                // Falha (ex: usuário negou a permissão)
                locationDenied = true;
                console.warn("Não foi possível obter localização (pode ter sido negada):", error.message);
            }
        );
    } else {
        console.warn("Geolocalização não é suportada por este navegador.");
        locationDenied = true; // Trata como se fosse negada
    }

    // 2. Seleciona TODOS os botões de filtro (pela classe que adicionamos)
    const filterButtons = document.querySelectorAll('.botao-filtro');

    // 3. Adiciona um event listener (monitor de clique) para CADA botão
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            
            // Pega a URL base do atributo 'data-url'
            // (ex: /hospitais?ordenar=alfabetica)
            let baseUrl = button.dataset.url;
            
            // Verifica se este botão específico é o de "Ordenar por Distância"
            const isSortByDistance = baseUrl.includes('ordenar=distancia');

            // 4. Lógica de redirecionamento
            
            if (userLocation) {
                // CASO 1: TEMOS a localização.
                // Anexa a localização em TODOS os filtros e redireciona.
                window.location.href = `${baseUrl}&lat=${userLocation.lat}&lng=${userLocation.lng}`;
            
            } else if (locationDenied && isSortByDistance) {
                // CASO 2: O usuário NEGOU a permissão E está clicando em "Ordenar por Distância".
                // Exibe um alerta de erro.
                alert("Não foi possível obter sua localização. A ordenação por distância não está disponível. Por favor, libere a permissão de localização no seu navegador.");

            } else if (!userLocation && isSortByDistance) {
                // CASO 3: A localização AINDA não foi obtida (está em processo) E
                // o usuário clica em "Ordenar por Distância". Pede para ele esperar.
                alert("Aguarde, estamos tentando obter sua localização. Tente novamente em alguns segundos.");
                
            } else {
                // CASO 4: Outros filtros (alfabetica, media_geral)
                // ou se o usuário negou a localização para esses filtros,
                // apenas vai para a URL base sem a localização.
                window.location.href = baseUrl;
            }
        });
    });
});