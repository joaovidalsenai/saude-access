document.addEventListener('DOMContentLoaded', () => {
    // Seleciona o botão 'voltar' pelo sua classe
    const backButton = document.querySelector('a.voltar-btn');

    // Verifica se o botão existe na página
    if (backButton) {
        // Adiciona um evento de clique ao botão
        backButton.addEventListener('click', function (event) {
            // Previne o comportamento padrão do link, que é navegar para o href
            event.preventDefault();

            // Verifica se a página de referência (a última visitada) é a página de avaliação
            if (document.referrer.includes('/hospital/avaliacao')) {
                // Se o usuário veio da página de avaliação, redireciona para a lista de hospitais
                window.location.href = '/hospitais';
            } else {
                // Caso contrário, simplesmente volta para a página anterior no histórico de navegação
                history.back();
            }
        });
    }
});