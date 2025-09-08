// public/js/login.js
// Versão refatorada usando auth-utils

async function fazerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    const botaoEntrar = document.querySelector('.btn-entrar');
    
    // As validações de frontend continuam aqui...
    if (!email || !senha) { /* ... */ }
    if (!AuthUtils.validarEmail(email)) { /* ... */ }
    
    const textoOriginal = botaoEntrar.textContent;
    botaoEntrar.disabled = true;
    botaoEntrar.textContent = 'Entrando...';
    
    try {
        console.log('🔐 Tentando fazer login via backend...');
        
        const response = await fetch('/auth/entrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, password: senha }),
        });

        const result = await response.json();

        if (!response.ok) {
            // O backend já envia uma mensagem de erro amigável
            console.error('❌ Erro no login:', result.error);
            AuthUtils.mostrarMensagem(result.error || 'Erro inesperado.', 'erro');
        } else {
            console.log('✅ Login realizado com sucesso!');
            AuthUtils.mostrarMensagem('Login realizado com sucesso! Redirecionando...', 'sucesso');
            
            setTimeout(() => {
                window.location.href = '/inicio'; // Ou outra página protegida
            }, 1500);
        }
        
    } catch (error) {
        console.error('❌ Erro crítico:', error);
        AuthUtils.mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    } finally {
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = textoOriginal;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Formulário de login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', fazerLogin);
    } else {
        console.error('❌ Formulário de login não encontrado!');
    }
    
    // Navegação com Enter
    const emailInput = document.getElementById('login-email');
    const senhaInput = document.getElementById('login-senha');
    
    if (emailInput && senhaInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                senhaInput.focus();
            }
        });
        
        senhaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                fazerLogin(e);
            }
        });
    }
});