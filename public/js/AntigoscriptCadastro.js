const REGEX = {
    email: /^(?!\.)(?!.*\.{2})[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*@(?:[a-zA-Z0-9]+\.)+[a-zA-Z]{2,}$/,
    nome: /^[A-Za-zÀ-ÖØ-öø-ÿÇç]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿÇç]+)+$/,
    cpf: /^(?:[0-9]{3}\.){2}[0-9]{3}-[0-9]{2}|[0-9]{11}$/,
    cep: /^[0-9]{5}(?:-[0-9]{3})?|[0-9]{8}$/,
    senha: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Elementos do DOM
const DOM = {
    input: {
        nome: document.getElementById("cadastro-nome"),
        email: document.getElementById("cadastro-email"),
        cpf: document.getElementById("cadastro-cpf"),
        nascimento: document.getElementById("cadastro-nascimento"),
        cep: document.getElementById("cadastro-cep"),
        senha: document.getElementById("cadastro-senha"),
        confirmarSenha: document.getElementById("cadastro-confirm-senha")
    }
};

// Função para formatar CPF enquanto digita
function formatarCPF(elemento) {
    elemento.addEventListener("input", function(e) {
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
}

// Função para formatar CEP enquanto digita
function formatarCEP(elemento) {
    elemento.addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 8) value = value.slice(0, 8);
        
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d{1,3})$/, "$1-$2");
        }
        
        e.target.value = value;
    });
}

// Função para formatar telefone (bônus)
function formatarTelefone(elemento) {
    elemento.addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);
        
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{1,4})$/, "($1) $2-$3");
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{1,4})$/, "($1) $2");
        }
        
        e.target.value = value;
    });
}

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

// Função para buscar informações do CEP
function buscarCEP(cep, callback) {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
        callback(null, 'CEP deve ter 8 dígitos');
        return;
    }
    
    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                callback(null, 'CEP não encontrado');
            } else {
                callback(data, null);
            }
        })
        .catch(() => {
            callback(null, 'Erro ao buscar CEP');
        });
}

// Função para mostrar indicador de carregamento
function mostrarCarregamento(elemento, texto = 'Carregando...') {
    const loading = document.createElement('div');
    loading.className = 'loading-indicator';
    loading.textContent = texto;
    elemento.parentNode.insertBefore(loading, elemento.nextSibling);
    return loading;
}

// Função para remover indicador de carregamento
function removerCarregamento(elemento) {
    const loading = elemento.parentNode.querySelector('.loading-indicator');
    if (loading) {
        loading.remove();
    }
}

// Função de inicialização para aplicar formatações e validações
function inicializar() {
    // Aplicar formatações se os elementos existirem
    if (DOM.input.cpf) {
        formatarCPF(DOM.input.cpf);
    }
    
    if (DOM.input.cep) {
        formatarCEP(DOM.input.cep);
    }
    
    // Adicionar validação em tempo real para cada campo
    Object.keys(DOM.input).forEach(campo => {
        const elemento = DOM.input[campo];
        if (elemento && validacoes[campo]) {
            elemento.addEventListener('blur', function() {
                validarCampo(campo, this);
            });
        }
    });
    
    // Adicionar funcionalidade de busca de CEP
    if (DOM.input.cep) {
        DOM.input.cep.addEventListener('blur', function() {
            const cep = this.value;
            
            if (validarCampo('cep', this)) {
                const loading = mostrarCarregamento(this, 'Buscando CEP...');
                
                buscarCEP(cep, (dados, erro) => {
                    removerCarregamento(this);
                    
                    if (erro) {
                        exibirErro(this, erro);
                    } else {
                        console.log('CEP encontrado:', dados);
                        exibirErro(this, '');
                        
                        // Disparar evento customizado com os dados do CEP
                        const evento = new CustomEvent('cepEncontrado', {
                            detail: dados
                        });
                        this.dispatchEvent(evento);
                    }
                });
            }
        });
    }
}

// Função utilitária para obter dados limpos de um formulário
function obterDadosFormulario(formSelector = 'form') {
    const form = document.querySelector(formSelector);
    const dados = {};
    
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            let valor = input.value;
            
            // Limpar formatação de campos específicos
            if (input.type === 'text') {
                if (input.id && input.id.includes('cpf')) {
                    valor = valor.replace(/\D/g, '');
                } else if (input.id && input.id.includes('cep')) {
                    valor = valor.replace(/\D/g, '');
                } else if (input.id && input.id.includes('telefone')) {
                    valor = valor.replace(/\D/g, '');
                }
            }
            
            dados[input.name || input.id] = valor;
        });
    }
    
    return dados;
}

// Função utilitária para validar formulário completo
function validarFormulario(campos = null) {
    let valido = true;
    const camposParaValidar = campos || Object.keys(DOM.input);
    
    camposParaValidar.forEach(campo => {
        const elemento = DOM.input[campo];
        if (elemento && validacoes[campo]) {
            if (!validarCampo(campo, elemento)) {
                valido = false;
            }
        }
    });
    
    return valido;
}

// Inicializar quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}

// Exportar funções úteis para uso global
window.FormUtils = {
    validarCampo,
    validarFormulario,
    obterDadosFormulario,
    buscarCEP,
    formatarCPF,
    formatarCEP,
    formatarTelefone,
    exibirErro
};