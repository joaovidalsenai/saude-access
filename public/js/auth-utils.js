// public/js/auth-utils.js
// Utilitários compartilhados para autenticação

let supabase = null;

// Inicializar Supabase (usado em login e cadastro)
async function initSupabase() {
    if (supabase) return true; // Já inicializado
    
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        console.log('✅ Supabase inicializado');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        mostrarMensagem('Erro ao conectar com o servidor', 'erro');
        return false;
    }
}

// Sistema unificado de mensagens
function mostrarMensagem(mensagem, tipo = 'info', elemento = null) {
    // Remove mensagem anterior
    const mensagemAnterior = document.querySelector('.auth-mensagem');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    // Estilos por tipo
    const estilos = {
        erro: {
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb'
        },
        sucesso: {
            background: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb'
        },
        info: {
            background: '#d1ecf1',
            color: '#0c5460',
            border: '1px solid #bee5eb'
        }
    };
    
    // Cria elemento de mensagem
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = 'auth-mensagem';
    mensagemDiv.style.cssText = `
        padding: 12px;
        border-radius: 5px;
        margin: 15px 0;
        text-align: center;
        ${Object.entries(estilos[tipo] || estilos.info)
            .map(([prop, value]) => `${prop}: ${value}`)
            .join('; ')};
    `;
    mensagemDiv.textContent = mensagem;
    
    // Posiciona a mensagem
    const container = elemento || document.querySelector('.btn-entrar, #btn-cadastrar')?.parentNode;
    if (container) {
        const botao = container.querySelector('.btn-entrar, #btn-cadastrar');
        container.insertBefore(mensagemDiv, botao);
    }
    
    // Remove automaticamente após 5 segundos (exceto sucesso)
    if (tipo !== 'sucesso') {
        setTimeout(() => {
            if (mensagemDiv.parentNode) {
                mensagemDiv.remove();
            }
        }, 5000);
    }
}

// Validação de email
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validação de senha
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
        criterios: criterios.map(c => ({
            ...c,
            atende: c.regex.test(senha)
        }))
    };
}

// Traduzir erros do Supabase
function traduzirErroSupabase(error) {
    const traducoes = {
        'Invalid login credentials': 'Email ou senha incorretos',
        'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
        'User already registered': 'Este email já está cadastrado',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
        'Signup not allowed for this instance': 'Cadastro não permitido'
    };
    
    return traducoes[error.message] || error.message;
}

// Verificar se usuário está logado
async function verificarLogin() {
    const initialized = await initSupabase();
    if (!initialized) return false;
    
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

// Fazer logout
async function fazerLogout() {
    const initialized = await initSupabase();
    if (!initialized) return false;
    
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = '/login';
        return true;
    }
    return false;
}

// Verificar sessão com logs detalhados
async function verificarSessao() {
    if (!supabase) {
        console.log('🔧 Supabase não inicializado, inicializando...');
        const initialized = await initSupabase();
        if (!initialized) {
            console.error('❌ Falha ao inicializar Supabase');
            return null;
        }
    }
    
    try {
        console.log('🔍 Verificando sessão...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            return null;
        }
        
        if (session) {
            console.log('✅ Sessão encontrada:', session.user.email);
            console.log('⏰ Sessão expira em:', new Date(session.expires_at * 1000).toLocaleString());
            return session;
        } else {
            console.log('❌ Nenhuma sessão encontrada');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Erro crítico na verificação:', error);
        return null;
    }
}

// Proteger página atual
async function protegerPagina() {
    console.log('🔍 Verificando autenticação...');
    
    const session = await verificarSessao();
    
    if (!session) {
        console.log('❌ Usuário não autenticado, redirecionando para login...');
        window.location.href = '/login';
        return false;
    }
    
    console.log('✅ Usuário autenticado');
    document.body.classList.add('authenticated');
    return true;
}

// Obter informações do usuário
async function obterUsuario() {
    const session = await verificarSessao();
    return session?.user || null;
}

// Preencher elementos com dados do usuário
async function preencherInfoUsuario(seletor, tipo) {
    const user = await obterUsuario();
    if (user) {
        let valor;
        switch (tipo) {
            case 'email':
                valor = user.email;
                break;
            case 'nome':
                valor = user.user_metadata?.name || user.email.split('@')[0];
                break;
            case 'id':
                valor = user.id;
                break;
            default:
                console.error(`Tipo de dado desconhecido: ${tipo}`);
                return;
        }

        document.querySelectorAll(seletor).forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = valor;
            } else {
                el.textContent = valor;
            }
        });
    }
}

// Auto-proteção de páginas
async function autoProtegerPagina() {
    console.log('🚀 Página carregada, verificando proteção...');
    
    if (document.body.classList.contains('protected')) {
        console.log('🛡️ Página marcada como protegida');
        
        const isAuthenticated = await protegerPagina();
        if (isAuthenticated) {
            console.log('✅ Usuário autenticado, preenchendo informações...');
            await preencherInfoUsuario('.perfil-nome, .user-name', 'nome');
            await preencherInfoUsuario('.perfil-email, .user-email', 'email');
        }
    } else {
        console.log('ℹ️ Página não protegida');
    }
}

// Listener para auto-proteção
document.addEventListener('DOMContentLoaded', autoProtegerPagina);

// Exportar para uso global
window.AuthUtils = {
    initSupabase,
    mostrarMensagem,
    validarEmail,
    validarSenha,
    traduzirErroSupabase,
    verificarLogin,
    verificarSessao,
    protegerPagina,
    obterUsuario,
    preencherInfoUsuario,
    fazerLogout,
    getSupabase: () => supabase
};

// Compatibilidade com código antigo
window.protegerPagina = protegerPagina;
window.logout = fazerLogout;
window.obterUsuario = obterUsuario;