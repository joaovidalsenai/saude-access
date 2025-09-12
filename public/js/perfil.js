function showContent(contentId) {
    // Esconde todas as seções de conteúdo
    document.querySelectorAll('.perfil-content').forEach(function(content) {
        content.classList.add('hidden');
    });

    // Remove a classe 'active' de todos os botões de aba
    document.querySelectorAll('.tab-button').forEach(function(button) {
        button.classList.remove('active');
    });

    // Mostra o conteúdo selecionado e ativa o botão correspondente
    document.getElementById(contentId).classList.remove('hidden');
    document.querySelector('.tab-button[onclick="showContent(\'' + contentId + '\')"]').classList.add('active');
}

async function fazerLogout() {
    try {
        await fetch('/auth/sair', { method: 'POST' });
        // Redireciona para a página de login após o logout ser bem-sucedido
        window.location.href = '/login';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        mostrarMensagem('Não foi possível fazer logout. Tente novamente.', 'erro');
    }
}

document.querySelectorAll('.btn-logout').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        fazerLogout(); // Chama a função diretamente
    });
});