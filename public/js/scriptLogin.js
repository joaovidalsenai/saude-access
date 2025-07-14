const REGEX = {
    email: /^(?!\.)(?!.*\.{2})[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@(?:[a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/,
    cpf: /^(?:[0-9]{3}\.){2}[0-9]{3}-[0-9]{2}|[0-9]{11}$/
};

// Elementos do DOM
const DOM = {
    form: document.querySelector("form"),
    input: {
        credencial: document.getElementById("login-credencial"),
        senha: document.getElementById("login-senha"),
        lembrarLogin: document.getElementById("lembrar-login")
    },
    botao: {
        entrar: document.querySelector(".btn-entrar")
    }
};

// Função para detectar se a credencial é CPF ou email
function detectarTipoCredencial(valor) {
    const valorLimpo = valor.replace(/\D/g, "");
    
    // Se tem apenas números e tem 11 dígitos, provavelmente é CPF
    if (valorLimpo.length === 11 && valor.replace(/[.\-]/g, "") === valorLimpo) {
        return "cpf";
    }
    
    // Se contém @ provavelmente é email
    if (valor.includes("@")) {
        return "email";
    }
    
    // Se tem entre 1-10 dígitos, pode ser CPF sendo digitado
    if (valorLimpo.length > 0 && valorLimpo.length <= 11 && !valor.includes("@")) {
        return "cpf";
    }
    
    return "email";
}

// Função para formatar CPF enquanto digita
function formatarCPF(valor) {
    let cpf = valor.replace(/\D/g, "");
    if (cpf.length > 11) cpf = cpf.slice(0, 11);
    
    if (cpf.length > 9) {
        cpf = cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
    } else if (cpf.length > 6) {
        cpf = cpf.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (cpf.length > 3) {
        cpf = cpf.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
    }
    
    return cpf;
}

// Formatação automática do campo de credencial
DOM.input.credencial.addEventListener("input", function(e) {
    const valor = e.target.value;
    const tipo = detectarTipoCredencial(valor);
    
    if (tipo === "cpf") {
        e.target.value = formatarCPF(valor);
        e.target.setAttribute("placeholder", "Digite seu CPF");
    } else {
        e.target.setAttribute("placeholder", "Digite seu E-mail");
    }
});

// Validações de cada campo
const validacoes = {
    credencial: (valor) => {
        if (!valor) return "CPF ou E-mail é obrigatório.";
        
        const valorLimpo = valor.trim();
        const tipo = detectarTipoCredencial(valorLimpo);
        
        if (tipo === "cpf") {
            const cpfLimpo = valorLimpo.replace(/\D/g, "");
            if (cpfLimpo.length !== 11) return "CPF deve ter 11 dígitos.";
            if (!validarCPF(cpfLimpo)) return "CPF inválido.";
        } else {
            if (!REGEX.email.test(valorLimpo)) return "E-mail inválido.";
        }
        
        return "";
    },
    
    senha: (valor) => {
        if (!valor) return "Senha é obrigatória.";
        if (valor.length < 3) return "Senha muito curta.";
        return "";
    }
};

// Função para validar CPF (mesmo algoritmo do cadastro)
function validarCPF(cpf) {
    // Elimina CPFs inválidos conhecidos
    if (
        cpf === "00000000000" ||
        cpf === "11111111111" ||
        cpf === "22222222222" ||
        cpf === "33333333333" ||
        cpf === "44444444444" ||
        cpf === "55555555555" ||
        cpf === "66666666666" ||
        cpf === "77777777777" ||
        cpf === "88888888888" ||
        cpf === "99999999999"
    ) {
        return false;
    }
    
    // Valida 1º dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    // Valida 2º dígito
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Função para exibir mensagem de erro
function exibirErro(elemento, mensagem) {
    // Remove mensagem de erro existente
    const erroExistente = elemento.parentNode.querySelector('.erro-mensagem');
    if (erroExistente) {
        erroExistente.remove();
    }
    
    // Se não há mensagem de erro, remove a classe de erro e retorna
    if (!mensagem) {
        elemento.classList.remove('input-erro');
        return;
    }
    
    // Adiciona classe de erro ao input
    elemento.classList.add('input-erro');
    
    // Cria elemento de mensagem de erro
    const erro = document.createElement('span');
    erro.className = 'erro-mensagem';
    erro.textContent = mensagem;
    
    // Insere após o elemento
    elemento.parentNode.insertBefore(erro, elemento.nextSibling);
}

// Função para validar um campo específico
function validarCampo(nome, elemento) {
    const valor = elemento.value;
    const mensagemErro = validacoes[nome](valor);
    exibirErro(elemento, mensagemErro);
    return !mensagemErro;
}

// Adiciona validação em tempo real para cada campo
DOM.input.credencial.addEventListener('blur', function() {
    validarCampo('credencial', this);
});

DOM.input.senha.addEventListener('blur', function() {
    validarCampo('senha', this);
});

// Função para validar todo o formulário
function validarFormulario() {
    let valido = true;
    
    if (!validarCampo('credencial', DOM.input.credencial)) {
        valido = false;
    }
    
    if (!validarCampo('senha', DOM.input.senha)) {
        valido = false;
    }
    
    return valido;
}

// Função para exibir mensagem de erro geral do login
function exibirErroLogin(mensagem) {
    // Remove erro anterior
    const erroExistente = DOM.form.querySelector('.erro-login-geral');
    if (erroExistente) {
        erroExistente.remove();
    }
    
    if (mensagem) {
        const erro = document.createElement('div');
        erro.className = 'erro-login-geral';
        erro.textContent = mensagem;
        erro.style.cssText = `
            color: #e74c3c;
            background-color: #fdf2f2;
            border: 1px solid #e74c3c;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            text-align: center;
            font-size: 14px;
        `;
        
        DOM.form.insertBefore(erro, DOM.form.firstChild);
    }
}

// Função para simular autenticação (substituir por chamada real à API)
async function autenticarUsuario(credencial, senha) {
    // Simula delay da requisição
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulação para demonstração
    const usuariosDemo = [
        { cpf: "27619700552", email: "joao.silva@email.com", senha: "123456" }
    ];
    
    const credencialLimpa = credencial.includes("@") ? credencial : credencial.replace(/\D/g, "");
    const usuario = usuariosDemo.find(u => 
        (u.email === credencialLimpa || u.cpf === credencialLimpa) && u.senha === senha
    );
    
    if (usuario) {
        return { sucesso: true, usuario: usuario };
    } else {
        return { sucesso: false, erro: "CPF/E-mail ou senha incorretos." };
    }
}

// Função para salvar dados de login (se "Lembrar-me" estiver marcado)
function salvarDadosLogin(credencial) {
    if (DOM.input.lembrarLogin.checked) {
        try {
            // Salva apenas a credencial, nunca a senha
            const dadosLogin = {
                credencial: credencial,
                dataLogin: new Date().toISOString()
            };
            
            console.log('Dados de login salvos:', dadosLogin);
        } catch (error) {
            console.warn('Não foi possível salvar os dados de login:', error);
        }
    }
}

// Função para carregar dados de login salvos
function carregarDadosLogin() {
    try {
    } catch (error) {
        console.warn('Não foi possível carregar os dados de login:', error);
    }
}

// Função para adicionar indicador de carregamento
function mostrarCarregamento(mostrar = true) {
    if (mostrar) {
        DOM.botao.entrar.disabled = true;
        DOM.botao.entrar.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 8px; color: white">
                <div style="width: 16px; height: 16px; border: 2px solid #ffffff40; border-top: 2px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                Entrando...
            </span>
        `;
        
        // Adiciona animação de rotação
        if (!document.querySelector('#spin-animation')) {
            const style = document.createElement('style');
            style.id = 'spin-animation';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        DOM.botao.entrar.disabled = false;
        DOM.botao.entrar.innerHTML = 'Entrar';
    }
}

// Event listener para o formulário
DOM.form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Remove mensagens de erro anteriores
    exibirErroLogin('');
    
    // Valida o formulário
    if (!validarFormulario()) {
        return;
    }
    
    const credencial = DOM.input.credencial.value.trim();
    const senha = DOM.input.senha.value;
    
    try {
        // Mostra indicador de carregamento
        mostrarCarregamento(true);
        
        // Tenta autenticar
        const resultado = await autenticarUsuario(credencial, senha);
        
        if (resultado.sucesso) {
            // Salva dados se necessário
            salvarDadosLogin(credencial);
            
            // Exibe mensagem de sucesso
            exibirErroLogin('');
            const sucesso = document.createElement('div');
            sucesso.className = 'sucesso-login';
            sucesso.textContent = 'Login realizado com sucesso! Redirecionando...';
            sucesso.style.cssText = `
                color: #27ae60;
                background-color: #f0f9f4;
                border: 1px solid #27ae60;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 15px;
                text-align: center;
                font-size: 14px;
            `;
            DOM.form.insertBefore(sucesso, DOM.form.firstChild);
            
            // Redireciona após 2 segundos
            setTimeout(() => {
                window.location.href = 'inicio.html';
            }, 2000);
            
        } else {
            exibirErroLogin(resultado.erro);
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        exibirErroLogin('Erro de conexão. Tente novamente.');
    } finally {
        // Remove indicador de carregamento
        mostrarCarregamento(false);
    }
});

// Permite submit com Enter
DOM.input.senha.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        DOM.form.dispatchEvent(new Event('submit'));
    }
});

// Carrega dados salvos quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosLogin();
});

// Limpa mensagens de erro quando o usuário começa a digitar
DOM.input.credencial.addEventListener('input', function() {
    if (this.value.length > 0) {
        exibirErro(this, '');
        exibirErroLogin('');
    }
});

DOM.input.senha.addEventListener('input', function() {
    if (this.value.length > 0) {
        exibirErro(this, '');
        exibirErroLogin('');
    }
});