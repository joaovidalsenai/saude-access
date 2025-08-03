// public/js/login.js
let supabase = null

// Inicializar Supabase
async function initSupabase() {
    try {
        const response = await fetch('/api/config')
        const config = await response.json()
        supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
        console.log('✅ Supabase inicializado para login')
        return true
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error)
        mostrarErro('Erro ao conectar com o servidor')
        return false
    }
}

// Função para mostrar erros na tela
function mostrarErro(mensagem) {
    // Remove erro anterior se existir
    const erroAnterior = document.querySelector('.erro-login')
    if (erroAnterior) {
        erroAnterior.remove()
    }
    
    // Cria novo elemento de erro
    const erroDiv = document.createElement('div')
    erroDiv.className = 'erro-login'
    erroDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 12px;
        border-radius: 5px;
        margin: 15px 0;
        border: 1px solid #f5c6cb;
        text-align: center;
    `
    erroDiv.textContent = mensagem
    
    // Insere antes do botão de entrar
    const botaoEntrar = document.querySelector('.btn-entrar')
    botaoEntrar.parentNode.insertBefore(erroDiv, botaoEntrar)
    
    // Remove o erro após 5 segundos
    setTimeout(() => {
        if (erroDiv.parentNode) {
            erroDiv.remove()
        }
    }, 5000)
}

// Função para mostrar sucesso
function mostrarSucesso(mensagem) {
    const sucessoDiv = document.createElement('div')
    sucessoDiv.style.cssText = `
        background: #d4edda;
        color: #155724;
        padding: 12px;
        border-radius: 5px;
        margin: 15px 0;
        border: 1px solid #c3e6cb;
        text-align: center;
    `
    sucessoDiv.textContent = mensagem
    
    const botaoEntrar = document.querySelector('.btn-entrar')
    botaoEntrar.parentNode.insertBefore(sucessoDiv, botaoEntrar)
}

// Função principal de login
async function fazerLogin(event) {
    event.preventDefault()
    
    const email = document.getElementById('login-email').value.trim()
    const senha = document.getElementById('login-senha').value
    const botaoEntrar = document.querySelector('.btn-entrar')
    
    // Validação básica
    if (!email || !senha) {
        mostrarErro('Preencha todos os campos')
        return
    }
    
    // Desabilitar botão durante o login
    const textoOriginal = botaoEntrar.textContent
    botaoEntrar.disabled = true
    botaoEntrar.textContent = 'Entrando...'
    
    try {
        // Inicializar Supabase se necessário
        if (!supabase) {
            const initialized = await initSupabase()
            if (!initialized) {
                return
            }
        }
        
        console.log('🔐 Tentando fazer login...')
        
        // Fazer login com Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha,
        })
        
        if (error) {
            console.error('❌ Erro no login:', error.message)
            
            // Traduzir mensagens de erro comuns
            let mensagemErro = error.message
            if (error.message.includes('Invalid login credentials')) {
                mensagemErro = 'Email ou senha incorretos'
            } else if (error.message.includes('Email not confirmed')) {
                mensagemErro = 'Email não confirmado. Verifique sua caixa de entrada.'
            }
            
            mostrarErro(mensagemErro)
        } else {
            console.log('✅ Login realizado com sucesso!')
            mostrarSucesso('Login realizado com sucesso! Redirecionando...')
            
            // Aguardar um pouco e redirecionar
            setTimeout(() => {
                window.location.href = '/inicio'
            }, 1500)
        }
        
    } catch (error) {
        console.error('❌ Erro crítico:', error)
        mostrarErro('Erro inesperado. Tente novamente.')
    } finally {
        // Reabilitar botão
        botaoEntrar.disabled = false
        botaoEntrar.textContent = textoOriginal
    }
}

// Verificar se usuário já está logado
async function verificarSeJaLogado() {
    const initialized = await initSupabase()
    if (!initialized) return
    
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
        console.log('✅ Usuário já está logado, redirecionando...')
        window.location.href = '/inicio'
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já está logado
    verificarSeJaLogado()
    
    // Adicionar event listener ao formulário
    const formLogin = document.getElementById('formLogin')
    if (formLogin) {
        formLogin.addEventListener('submit', fazerLogin)
    } else {
        console.error('❌ Formulário de login não encontrado!')
    }
    
    // Adicionar event listener para Enter nos campos
    document.getElementById('login-email').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('login-senha').focus()
        }
    })
    
    document.getElementById('login-senha').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fazerLogin(e)
        }
    })
})