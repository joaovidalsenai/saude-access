// V_2025.09.08
/**
 * AuthUtils - Funções Utilitárias de Autenticação e Formatação
 * Este arquivo centraliza funções para autenticação, validação,
 * exibição de mensagens e formatação de dados.
 */

// ==================================
// FUNÇÕES DE FORMATAÇÃO
// ==================================

/**
 * Formata um valor para o padrão de CPF (000.000.000-00).
 * @param {string} valor O valor a ser formatado.
 * @returns {string} O valor formatado como CPF.
 */
function formatarCPF(valor) {
    if (!valor) return '';
    valor = String(valor).replace(/\D/g, '').substring(0, 11);
    if (valor.length > 9) return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (valor.length > 6) return valor.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    if (valor.length > 3) return valor.replace(/(\d{3})(\d{3})/, '$1.$2');
    return valor;
}

/**
 * Formata um valor para o padrão de telefone (XX) XXXXX-XXXX.
 * @param {string} valor O valor a ser formatado.
 * @returns {string} O valor formatado como telefone.
 */
function formatarTelefone(valor) {
    if (!valor) return '';
    valor = String(valor).replace(/\D/g, '').substring(0, 11);
    if (valor.length === 11) return valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (valor.length === 10) return valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return valor;
}

/**
 * Formata um valor para o padrão de CEP (00000-000).
 * @param {string} valor O valor a ser formatado.
 * @returns {string} O valor formatado como CEP.
 */
function formatarCEP(valor) {
    if (!valor) return '';
    valor = String(valor).replace(/\D/g, '').substring(0, 8);
    if (valor.length > 5) return valor.replace(/(\d{5})(\d{3})/, '$1-$2');
    return valor;
}

/**
 * Remove todos os caracteres não numéricos de uma string.
 * @param {string} valor A string de entrada.
 * @returns {string} A string contendo apenas números.
 */
function obterNumerosPuros(valor) {
    if (!valor) return '';
    return String(valor).replace(/\D/g, '');
}


// ==================================
// FUNÇÕES DE UI E VALIDAÇÃO
// ==================================

// ... (seu código existente para mostrarMensagem, validarEmail, validarSenha)
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
    const container = elemento || document.querySelector('.btn-entrar, #btn-cadastrar, .btn-finalizar')?.parentNode;
    if (container) {
        container.insertBefore(mensagemDiv, container.querySelector('.btn-entrar, #btn-cadastrar, .btn-finalizar'));
    }
    if (tipo === 'sucesso') {
         setTimeout(() => { if (mensagemDiv.parentNode) mensagemDiv.remove(); }, 3000);
    } else {
        setTimeout(() => { if (mensagemDiv.parentNode) mensagemDiv.remove(); }, 5000);
    }
}

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


// ==================================
// FUNÇÕES DE AUTENTICAÇÃO (API)
// ==================================

async function autenticarUsuario() {
    try {
        const response = await fetch('/auth');
        if (!response.ok) {
            window.location.href = '/login';
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        window.location.href = '/login';
        return null;
    }
}

// ==================================
// INICIALIZAÇÃO E ESCOPO GLOBAL
// ==================================

// Adiciona um listener que roda em TODAS as páginas.
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona listener aos botões de logout

    // VERIFICA SE A PÁGINA É PROTEGIDA
    if (document.body.classList.contains('protected')) {
        autenticarUsuario().then(user => {
            if (user) {
                // Torna o conteúdo principal visível
                document.body.style.visibility = 'visible';
            }
        });
    }
});

// Exporta as funções úteis para o escopo global (window)
window.AuthUtils = {
    // UI e Validação
    mostrarMensagem,
    validarEmail,
    validarSenha,
    // Autenticação
    autenticarUsuario,
    // Formatação
    formatarCPF,
    formatarTelefone,
    formatarCEP,
    obterNumerosPuros
};