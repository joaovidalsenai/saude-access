// Exemplo de como um botão "Ordenar por Distância" funcionaria
const botaoOrdenarDistancia = document.getElementById('ordenar-distancia');

botaoOrdenarDistancia.addEventListener('click', () => {
    if ("geolocation" in navigator) {
        // Pede a localização
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Redireciona o usuário para a rota /hospitais com os parâmetros
                window.location.href = `/hospitais?ordenar=distancia&lat=${lat}&lng=${lng}`;
            },
            (error) => {
                // Caso o usuário negue a permissão
                console.error("Erro ao obter localização:", error);
                alert("Não foi possível obter sua localização. A ordenação por distância não está disponível.");
                // Opcional: redirecionar para a lista alfabética
                // window.location.href = '/hospitais?ordenar=alfabetica';
            }
        );
    } else {
        alert("Geolocalização não é suportada pelo seu navegador.");
    }
});