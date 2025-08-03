// public/js/login.js

// Apenas regex para validar e-mail
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Elementos do DOM
const emailInput = document.getElementById('login-email');
const senhaInput = document.getElementById('login-senha');
const lembrarInput = document.getElementById('lembrar-login');
const btnEntrar = document.querySelector('.btn-entrar');
const form = document.getElementById('formLogin');

// Exibe ou limpa mensagem de erro de um campo
function exibirErro(input, mensagem) {
    const wrapper = input.parentNode
    const erroExistente = wrapper.querySelector('.erro-mensagem')
    if (erroExistente) erroExistente.remove()

    if (!mensagem) {
        input.classList.remove('input-erro')
        return
    }

    input.classList.add('input-erro')
    const span = document.createElement('span')
    span.className = 'erro-mensagem'
    span.textContent = mensagem
    wrapper.appendChild(span)
}

// Exibe mensagem de erro geral no topo do formulário
function exibirErroLogin(mensagem) {
    const existente = form.querySelector('.erro-login-geral')
    if (existente) existente.remove()

    if (!mensagem) return

    const div = document.createElement('div')
    div.className = 'erro-login-geral'
    div.textContent = mensagem
    div.style.cssText = `
        color: #e74c3c;
        background: #fdf2f2;
        border: 1px solid #e74c3c;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
        text-align: center;
        font-size: 14px;
    `
    form.insertBefore(div, form.firstChild)
}

// Exibe mensagem de sucesso
function exibirSucessoLogin(mensagem) {
    const existente = form.querySelector('.sucesso-login')
    if (existente) existente.remove()

    const div = document.createElement('div')
    div.className = 'sucesso-login'
    div.textContent = mensagem
    div.style.cssText = `
        color: #27ae60;
        background: #f0f9f4;
        border: 1px solid #27ae60;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
        text-align: center;
        font-size: 14px;
    `
    form.insertBefore(div, form.firstChild)
}

// Valida e-mail
function validarEmail() {
    const valor = emailInput.value.trim()
    if (!valor) return 'E-mail é obrigatório.'
    if (!REGEX_EMAIL.test(valor)) return 'Formato de e-mail inválido.'
    return ''
}

// Valida senha
function validarSenha() {
    const valor = senhaInput.value
    if (!valor) return 'Senha é obrigatória.'
    if (valor.length < 8) return 'Senha muito curta.'
    return ''
}

// Valida cada campo e exibe erro
function validarCampo(input, fnValidacao) {
    const msg = fnValidacao()
    exibirErro(input, msg)
    return !msg
}

// Indicador de loading no botão
function mostrarCarregamento(mostrar = true) {
    if (mostrar) {
        btnEntrar.disabled = true
        btnEntrar.innerHTML = `
            <span style="display:inline-flex;align-items:center;gap:8px;color:#fff">
                <div style="width:16px;height:16px;border:2px solid #fff40;border-top:2px solid #fff;border-radius:50%;animation:spin 1s linear infinite;"></div>
                Entrando...
            </span>`
        
        if (!document.getElementById('spin-style')) {
            const style = document.createElement('style')
            style.id = 'spin-style'
            style.textContent = `@keyframes spin {100%{transform:rotate(360deg)}}`
            document.head.appendChild(style)
        }
    } else {
        btnEntrar.disabled = false
        btnEntrar.textContent = 'Entrar'
    }
}

// Guarda e-mail se "lembrar-login" estiver checado
function salvarDadosLogin(email) {
    if (lembrarInput.checked) {
        try {
            localStorage.setItem('meuAppLogin', JSON.stringify({ email, data: Date.now() }))
        } catch (error) {
            console.log('Erro ao salvar dados de login:', error)
        }
    }
}

// Carrega e-mail salvo
function carregarDadosLogin() {
    try {
        const saved = JSON.parse(localStorage.getItem('meuAppLogin'))
        if (saved?.email) {
            emailInput.value = saved.email
            lembrarInput.checked = true
        }
    } catch (error) {
        console.log('Erro ao carregar dados salvos:', error)
    }
}

// Event listeners para limpar erros ao digitar
emailInput.addEventListener('input', () => {
    exibirErro(emailInput, '')
    exibirErroLogin('')
});

senhaInput.addEventListener('input', () => {
    exibirErro(senhaInput, '')
    exibirErroLogin('')
});

// Permitir submit com Enter na senha
senhaInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        form.dispatchEvent(new Event('submit'))
    }
});

// Validação e submissão do formulário
form.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    // Limpar mensagens anteriores
    exibirErroLogin('');

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    // Validar campos
    const okEmail = validarCampo(emailInput, validarEmail);
    const okSenha = validarCampo(senhaInput, validarSenha);
    
    if (!okEmail || !okSenha) {
        return;
    }

    try {
        // Mostrar loading
        mostrarCarregamento(true);

        // Chamar endpoint de login
        const response = await fetch('/api/entrada', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro na requisição');
        }

        const resultado = await response.json();

        if (resultado.success) {
            // Salvar dados se solicitado
            salvarDadosLogin(email);
            
            // Mostrar sucesso
            exibirSucessoLogin('Login realizado com sucesso! Redirecionando...');
            
            // Redirecionar após delay
            setTimeout(() => {
                window.location.href = '/inicio';
            }, 1500);
        } else {
            // Mostrar erro
            exibirErroLogin(resultado.error || 'Erro no login. Verifique suas credenciais.');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        exibirErroLogin('Erro de conexão. Tente novamente.');
    } finally {
        // Remover loading
        mostrarCarregamento(false);
    }
});

// Carrega dados salvos quando a página carrega
document.addEventListener('DOMContentLoaded', carregarDadosLogin);