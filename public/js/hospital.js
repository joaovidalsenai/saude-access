document.addEventListener('DOMContentLoaded', () => {
    const returnUrlKey = 'returnToPage';
    const evaluationPagePath = '/hospital/avaliacao';
    const hospitalPagePath = '/hospital'; // Refere-se à própria página do hospital

    // --- Lógica para Armazenar a Página de Origem ---
    // Verifica se a página anterior (referrer) não é a de avaliação ou a própria página do hospital.
    // Isso garante que estamos salvando o ponto de entrada real do usuário no fluxo (ex: /hospitais, /busca).
    if (document.referrer && !document.referrer.includes(evaluationPagePath) && !document.referrer.includes(hospitalPagePath)) {
        sessionStorage.setItem(returnUrlKey, document.referrer);
    }

    // Seleciona o botão 'voltar'
    const backButton = document.querySelector('a.voltar-btn');

    if (backButton) {
        // Adiciona um evento de clique ao botão
        backButton.addEventListener('click', function (event) {
            // Previne o comportamento padrão do link
            event.preventDefault();

            // Tenta obter a URL de retorno que foi salva
            const returnUrl = sessionStorage.getItem(returnUrlKey);

            if (returnUrl) {
                // Se uma URL de retorno foi encontrada, redireciona o usuário para ela
                window.location.href = returnUrl;
            } else {
                // Caso contrário (se o usuário acessou a página diretamente, por exemplo),
                // redireciona para a lista principal de hospitais como um fallback seguro.
                window.location.href = '/hospitais';
            }
        });
    }
});