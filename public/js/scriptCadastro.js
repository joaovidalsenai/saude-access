const REGEX = {
    email: /^(?!\.)(?!.*\.{2})[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@(?:[a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/,
    nome: /^[A-Za-zÀ-ÖØ-öø-ÿÇç]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿÇç]+)+$/,
    cpf: /^(?:[0-9]{3}\.){2}[0-9]{3}-[0-9]{2}|[0-9]{11}$/,
    cep: /^[0-9]{5}(?:-[0-9]{3})?|[0-9]{8}$/,
    senha: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Elementos do DOM
const DOM = {
    form: {
        info: document.getElementById("form-info"),
        senha: document.getElementById("form-senha"),
        completo: document.querySelector("form")
    },
    input: {
        nome: document.getElementById("cadastro-nome"),
        email: document.getElementById("cadastro-email"),
        cpf: document.getElementById("cadastro-cpf"),
        nascimento: document.getElementById("cadastro-nascimento"),
        cep: document.getElementById("cadastro-cep"),
        senha: document.getElementById("cadastro-senha"),
        confirmarSenha: document.getElementById("cadastro-confirm-senha")
    },
    botao: {
        voltar: document.getElementById("voltar"),
        prosseguir: document.getElementById("cadastro-prosseguir"),
        finalizar: document.getElementById("cadastro-finalizar")
    }
};

// Função para formatar CPF enquanto digita
DOM.input.cpf.addEventListener("input", function(e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 9) {
        value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
        value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (value.length > 3) {
        value = value.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
    }
    
    e.target.value = value;
});

// Função para formatar CEP enquanto digita
DOM.input.cep.addEventListener("input", function(e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    
    if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
    }
    
    e.target.value = value;
});

// Validações de cada campo
const validacoes = {
    nome: (valor) => {
        if (!valor) return "Nome é obrigatório.";
        
        const valorLimpo = valor.trim();
        if (!REGEX.nome.test(valorLimpo)) return "Digite seu nome completo (nome e sobrenome).";
        return "";
    },
    
    email: (valor) => {
        if (!valor) return "E-mail é obrigatório.";

        const valorLimpo = valor.trim();
        if (!REGEX.email.test(valorLimpo)) return "E-mail inválido.";
        return "";
    },
    
    cpf: (valor) => {
        const cpfLimpo = valor.replace(/\D/g, "");
        if (!cpfLimpo) return "CPF é obrigatório.";
        if (cpfLimpo.length !== 11) return "CPF deve ter 11 dígitos.";
        if (!validarCPF(cpfLimpo)) return "CPF inválido.";
        return "";
    },
    
    nascimento: (valor) => {
        if (!valor) return "Data de nascimento é obrigatória.";
        
        const dataNascimento = new Date(valor);
        const hoje = new Date();
        
        if (dataNascimento > hoje) return "Data de nascimento não pode ser no futuro.";
        
        const idade = calcularIdade(dataNascimento);
        if (idade < 18) return "É necessário ter mais de 18 anos.";
        if (idade > 120) return "Data de nascimento inválida.";
        
        return "";
    },
    
    cep: (valor) => {
        const cepLimpo = valor.replace(/\D/g, "");
        if (!cepLimpo) return "CEP é obrigatório.";
        if (cepLimpo.length !== 8) return "CEP deve ter 8 dígitos.";
        return "";
    },
    
    senha: (valor) => {
        if (!valor) return "Senha é obrigatória.";
        if (valor.length < 8) return "Senha deve ter pelo menos 8 caracteres.";
        if (!REGEX.senha.test(valor)) {
            return "Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.";
        }
        return "";
    },
    
    confirmarSenha: (valor) => {
        if (!valor) return "Confirmação de senha é obrigatória.";
        if (valor !== DOM.input.senha.value) return "As senhas não coincidem.";
        return "";
    }
};

// Função para validar CPF
function validarCPF(cpf) {
    // Elimina CPFs invalidos conhecidos
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
    
    // Valida 1o digito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    // Valida 2o digito
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
Object.keys(DOM.input).forEach(campo => {
    if (validacoes[campo]) {
        DOM.input[campo].addEventListener('blur', function() {
            validarCampo(campo, this);
        });
    }
});

// Função para validar a primeira etapa do formulário
function validarPrimeiraEtapa() {
    const camposPrimeiraEtapa = ['nome', 'email', 'cpf', 'nascimento'];
    let valido = true;
    
    camposPrimeiraEtapa.forEach(campo => {
        if (!validarCampo(campo, DOM.input[campo])) {
            valido = false;
        }
    });
    
    return valido;
}

// Função para validar a segunda etapa do formulário
function validarSegundaEtapa() {
    const camposSegundaEtapa = ['cep', 'senha', 'confirmarSenha'];
    let valido = true;
    
    camposSegundaEtapa.forEach(campo => {
        if (!validarCampo(campo, DOM.input[campo])) {
            valido = false;
        }
    });
    
    return valido;
}

// Função para alternar entre etapas do cadastro
function altCadastro(tipo) {
    if (tipo === 0) { // Avançar para a próxima etapa
        if (validarPrimeiraEtapa()) {
            DOM.form.info.style.display = "none";
            DOM.form.senha.style.display = "flex";
            DOM.botao.voltar.style.display = "block";
        }
    } else { // Voltar para a etapa anterior
        DOM.form.info.style.display = "flex";
        DOM.form.senha.style.display = "none";
        DOM.botao.voltar.style.display = "none";
    }
}

// Impedir envio do formulário se houver erros
DOM.form.completo.addEventListener('submit', function(e) {
    if (!validarSegundaEtapa()) {
        e.preventDefault();
    }
});

// Adicionar funcionalidade de pesquisa de CEP
DOM.input.cep.addEventListener('blur', function() {
    const cep = this.value.replace(/\D/g, '');
    
    if (cep.length === 8 && validarCampo('cep', this)) {
        // Mostrar indicador de carregamento
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-cep';
        loadingIndicator.textContent = 'Buscando CEP...';
        this.parentNode.insertBefore(loadingIndicator, this.nextSibling);
        
        // Buscar CEP usando a API do ViaCEP
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                // Remover indicador de carregamento
                loadingIndicator.remove();
                
                if (data.erro) {
                    exibirErro(this, 'CEP não encontrado.');
                } else {
                    // Você pode adicionar campos de endereço e preenchê-los automaticamente aqui
                    console.log('CEP encontrado:', data);
                    exibirErro(this, '');
                }
            })
            .catch(() => {
                loadingIndicator.remove();
                exibirErro(this, 'Erro ao buscar CEP.');
            });
    }
});