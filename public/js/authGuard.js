// public/js/checkAuth.js - Versão mais simples

let supabase = null

// Inicializa o cliente Supabase
async function initSupabase() {
    if (supabase) return supabase
    
    try {
        const response = await fetch('/api/config')
        const config = await response.json()
        
        supabase = window.supabase.createClient(
            config.supabaseUrl, 
            config.supabaseAnonKey
        )
        
        return supabase
    } catch (error) {
        console.error('Erro ao carregar configuração:', error)
        throw error
    }
}

// Páginas que não precisam de autenticação
const publicPages = ['/', '/login', '/cadastro', '/recuperar-senha']

async function checkAuthentication() {
    const currentPath = window.location.pathname
    
    // Se é página pública, não verifica
    if (publicPages.includes(currentPath)) {
        return
    }
    
    try {
        // Inicializa Supabase
        await initSupabase()
        
        // Verifica se há sessão ativa
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
            // Salva página atual para redirecionamento
            sessionStorage.setItem('redirectAfterLogin', currentPath)
            
            // Redireciona para login
            window.location.href = '/login'
            return
        }
        
        console.log('Usuário autenticado:', session.user.email)
        
    } catch (error) {
        console.error('Erro na verificação:', error)
        window.location.href = '/login'
    }
}

// Executa a verificação quando a página carrega
document.addEventListener('DOMContentLoaded', checkAuthentication)

// Função para logout (uso global)
window.logout = async function() {
    try {
        await initSupabase()
        await supabase.auth.signOut()
        window.location.href = '/login'
    } catch (error) {
        console.error('Erro no logout:', error)
    }
}