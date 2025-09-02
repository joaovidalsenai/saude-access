// public/js/auth-utils.js

// REMOVIDO: initSupabase, verificarLogin, verificarSessao, etc.

// Sistema unificado de mensagens (permanece o mesmo)
function mostrarMensagem(mensagem, tipo = 'info', elemento = null) {
    const mensagemAnterior = document.querySelector('.auth-mensagem');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    const estilos = {
        erro: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
        sucesso: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
        info: { background: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' }
    };
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = 'auth-mensagem';
    mensagemDiv.style.cssText = `padding: 12px; border-radius: 5px; margin: 15px 0; text-align: center; ${Object.entries(estilos[tipo] || estilos.info).map(([p, v]) => `${p}: ${v}`).join('; ')}`;
    mensagemDiv.textContent = mensagem;
    const container = elemento || document.querySelector('.btn-entrar, #btn-cadastrar')?.parentNode;
    if (container) {
        container.insertBefore(mensagemDiv, container.querySelector('.btn-entrar, #btn-cadastrar'));
    }
    if (tipo !== 'sucesso') {
        setTimeout(() => { if (mensagemDiv.parentNode) mensagemDiv.remove(); }, 5000);
    }
}

// Funções de validação (permanecem as mesmas)
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarSenha(senha) {
    const criterios = [
        { regex: /.{8,}/, texto: 'Mínimo de 8 caracteres' },
        { regex: /[A-Z]/, texto: 'Pelo menos 1 letra maiúscula' },
        { regex: /[a-z]/, texto: 'Pelo menos 1 letra minúscula' },
        { regex: /\d/, texto: 'Pelo menos 1 número' },
        { regex: /[@$!%*?&]/, texto: 'Pelo menos 1 caractere especial' }
    ];
    return {
        valida: criterios.every(c => c.regex.test(senha)),
        criterios: criterios.map(c => ({ ...c, atende: c.regex.test(senha) }))
    };
}

// NOVA: Função de Logout que chama o backend
async function fazerLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        // Redireciona para a página de login após o logout ser bem-sucedido
        window.location.href = '/login';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        mostrarMensagem('Não foi possível fazer logout. Tente novamente.', 'erro');
    }
}

// 1. Função para buscar os dados do usuário no backend
async function obterDadosUsuario() {
    try {
        const response = await fetch('/api/user');

        if (!response.ok) {
            // Se a resposta não for OK (ex: 401), o cookie é inválido ou expirou.
            // Redireciona para o login.
            window.location.href = '/login';
            return null;
        }

        const user = await response.json();
        return user;

    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        // Em caso de erro de rede, também redireciona para o login.
        window.location.href = '/login';
        return null;
    }
}

// --- ATUALIZAÇÃO: Gatilho de Carregamento da Página ---

// Adiciona um listener que roda em TODAS as páginas.
// Se a página for protegida, ele busca e preenche os dados do usuário.
document.addEventListener('DOMContentLoaded', async () => {
    // Adiciona listener aos botões de logout
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            AuthUtils.fazerLogout();
        });
    });

    // VERIFICA SE A PÁGINA É PROTEGIDA
    // (Você pode adicionar uma classe 'protected' ao <body> das suas páginas restritas)
    if (document.body.classList.contains('protected')) {
        const user = await obterDadosUsuario();
        if (user) {
            // Torna o conteúdo principal visível após carregar os dados
            document.body.style.visibility = 'visible';
        }
    }
});

// Exporta as funções úteis para o escopo global (window)
window.AuthUtils = {
    mostrarMensagem,
    validarEmail,
    validarSenha,
    fazerLogout,
    obterDadosUsuario, // Exporta a nova função
};

// Adiciona um listener para botões de logout em qualquer página
document.addEventListener('DOMContentLoaded', () => {
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            AuthUtils.fazerLogout();
        });
    });
});