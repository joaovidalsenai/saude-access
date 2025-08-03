// public/js/auth.js
let supabase = null

// Inicializar Supabase com configurações do servidor
async function initSupabase() {
    try {
        const response = await fetch('/api/config')
        const config = await response.json()
        
        supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
        console.log('✅ Supabase inicializado')
        return true
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error)
        return false
    }
}

// Verificar se usuário está logado
async function verificarSessao() {
    if (!supabase) {
        console.log('🔧 Supabase não inicializado, inicializando...')
        const initialized = await initSupabase()
        if (!initialized) {
            console.error('❌ Falha ao inicializar Supabase')
            return false
        }
    }
    
    try {
        console.log('🔍 Verificando sessão...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
            console.error('❌ Erro ao verificar sessão:', error)
            return false
        }
        
        if (session) {
            console.log('✅ Sessão encontrada:', session.user.email)
            console.log('⏰ Sessão expira em:', new Date(session.expires_at * 1000).toLocaleString())
            return true
        } else {
            console.log('❌ Nenhuma sessão encontrada')
            return false
        }
        
    } catch (error) {
        console.error('❌ Erro crítico na verificação:', error)
        return false
    }
}

// Proteger página atual
async function protegerPagina() {
    console.log('🔍 Verificando autenticação...')
    
    const isAuthenticated = await verificarSessao()
    
    if (!isAuthenticated) {
        console.log('❌ Usuário não autenticado, redirecionando para login...')
        window.location.href = '/login'
        return false
    }
    
    console.log('✅ Usuário autenticado')
    // Mostrar o conteúdo original
    document.body.classList.add('authenticated')
    return true
}

// Obter informações do usuário
async function obterUsuario() {
    if (!supabase) await initSupabase()
    
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
}

// Fazer logout
async function logout() {
    if (!supabase) await initSupabase()
    
    try {
        await supabase.auth.signOut()
        window.location.href = '/login'
    } catch (error) {
        console.error('Erro no logout:', error)
        // Forçar redirect mesmo com erro
        window.location.href = '/login'
    }
}

// Preencher informações do usuário na página
async function preencherInfoUsuario() {
    const user = await obterUsuario()
    if (user) {
        // Preencher elementos com classe 'user-email'
        document.querySelectorAll('.user-email').forEach(el => {
            el.textContent = user.email
        })
        
        // Preencher elementos com classe 'user-name'
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.user_metadata?.name || user.email.split('@')[0]
        })
    }
}

// Auto-executar proteção se a página tiver a classe 'protected'
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Página carregada, verificando proteção...')
    
    if (document.body.classList.contains('protected')) {
        console.log('🛡️ Página marcada como protegida')
        
        // Aguardar inicialização do Supabase
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const isAuthenticated = await protegerPagina()
        if (isAuthenticated) {
            console.log('✅ Usuário autenticado, preenchendo informações...')
            await preencherInfoUsuario()
        }
    } else {
        console.log('ℹ️ Página não protegida')
    }
})

// Remover esta linha que estava causando problema
// if (document.body && document.body.classList.contains('protected')) {
//     document.body.style.visibility = 'hidden'
// }

// Exportar funções para uso global
window.protegerPagina = protegerPagina
window.logout = logout
window.obterUsuario = obterUsuario