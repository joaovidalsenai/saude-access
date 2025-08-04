// public/js/login.js
// Versão refatorada usando auth-utils

async function fazerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    const botaoEntrar = document.querySelector('.btn-entrar');
    
    // Validação básica
    if (!email || !senha) {
        AuthUtils.mostrarMensagem('Preencha todos os campos', 'erro');
        return;
    }
    
    if (!AuthUtils.validarEmail(email)) {
        AuthUtils.mostrarMensagem('Email inválido', 'erro');
        return;
    }
    
    // Estado do botão
    const textoOriginal = botaoEntrar.textContent;
    botaoEntrar.disabled = true;
    botaoEntrar.textContent = 'Entrando...';
    
    try {
        // Inicializar Supabase
        const initialized = await AuthUtils.initSupabase();
        if (!initialized) {
            return;
        }
        
        console.log('🔐 Tentando fazer login...');
        
        // Login via Supabase
        const supabase = AuthUtils.getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha,
        });
        
        if (error) {
            console.error('❌ Erro no login:', error.message);
            const mensagemTraduzida = AuthUtils.traduzirErroSupabase(error);
            AuthUtils.mostrarMensagem(mensagemTraduzida, 'erro');
        } else {
            console.log('✅ Login realizado com sucesso!');
            AuthUtils.mostrarMensagem('Login realizado com sucesso! Redirecionando...', 'sucesso');
            
            setTimeout(() => {
                window.location.href = '/inicio';
            }, 1500);
        }
        
    } catch (error) {
        console.error('❌ Erro crítico:', error);
        AuthUtils.mostrarMensagem('Erro inesperado. Tente novamente.', 'erro');
    } finally {
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = textoOriginal;
    }
}

// Verificar se usuário já está logado
async function verificarSeJaLogado() {
    const jaLogado = await AuthUtils.verificarLogin();
    if (jaLogado) {
        console.log('✅ Usuário já está logado, redirecionando...');
        window.location.href = '/inicio';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já está logado
    verificarSeJaLogado();
    
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