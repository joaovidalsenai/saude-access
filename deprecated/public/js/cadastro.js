document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const form = document.querySelector('form');
    const nomeInput = document.getElementById('cadastro-nome');
    const nascimentoInput = document.getElementById('cadastro-nascimento');
    const telefoneInput = document.getElementById('cadastro-telefone');
    const cpfInput = document.getElementById('cadastro-cpf'); // Novo campo
    const emailInput = document.getElementById('cadastro-email');
    const senhaInput = document.getElementById('cadastro-senha');
    const confirmSenhaInput = document.getElementById('cadastro-confirm-senha');
    const btnCadastrar = document.getElementById('btn-cadastrar');
    
    if (!senhaInput || !form) return;
    
    // Funções de formatação
    function formatarCPF(valor) {
        // Remove tudo que não for número
        valor = valor.replace(/\D/g, '');
        
        // Limita a 11 dígitos
        valor = valor.substring(0, 11);
        
        // Aplica a máscara
        if (valor.length >= 9) {
            return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (valor.length >= 6) {
            return valor.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (valor.length >= 3) {
            return valor.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
        return valor;
    }
    
    function formatarTelefone(valor) {
        // Remove tudo que não for número
        valor = valor.replace(/\D/g, '');
        
        // Limita a 11 dígitos
        valor = valor.substring(0, 11);
        
        // Aplica a máscara
        if (valor.length === 11) {
            return valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (valor.length === 10) {
            return valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (valor.length >= 6) {
            return valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (valor.length >= 2) {
            return valor.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
        return valor;
    }
    
    function obterNumerosPuros(valor) {
        return valor.replace(/\D/g, '');
    }
    
    // Event listeners para formatação com controle de posição do cursor
    cpfInput.addEventListener('input', (e) => {
        const valorAnterior = e.target.value;
        const posicaoCursor = e.target.selectionStart;
        const valorFormatado = formatarCPF(e.target.value);
        
        // Calcular nova posição do cursor
        let novaPosicao = posicaoCursor;
        if (valorFormatado.length > valorAnterior.length) {
            // Se adicionou caracteres de formatação, ajustar cursor
            const caracteresAdicionados = valorFormatado.length - valorAnterior.length;
            novaPosicao += caracteresAdicionados;
        }
        
        e.target.value = valorFormatado;
        
        // Reposicionar cursor se necessário
        setTimeout(() => {
            e.target.setSelectionRange(novaPosicao, novaPosicao);
        }, 0);
        
        validarFormulario();
    });
    
    telefoneInput.addEventListener('input', (e) => {
        const valorAnterior = e.target.value;
        const posicaoCursor = e.target.selectionStart;
        const valorFormatado = formatarTelefone(e.target.value);
        
        // Calcular nova posição do cursor
        let novaPosicao = posicaoCursor;
        if (valorFormatado.length > valorAnterior.length) {
            // Se adicionou caracteres de formatação, ajustar cursor
            const caracteresAdicionados = valorFormatado.length - valorAnterior.length;
            novaPosicao += caracteresAdicionados;
        }
        
        e.target.value = valorFormatado;
        
        // Reposicionar cursor se necessário
        setTimeout(() => {
            e.target.setSelectionRange(novaPosicao, novaPosicao);
        }, 0);
        
        validarFormulario();
    });
    
    // Prevenir entrada de caracteres não numéricos
    cpfInput.addEventListener('keypress', (e) => {
        // Permite apenas números, backspace, delete, tab, escape, enter
        if (!/[0-9]/.test(e.key) && 
            !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    telefoneInput.addEventListener('keypress', (e) => {
        // Permite apenas números, backspace, delete, tab, escape, enter
        if (!/[0-9]/.test(e.key) && 
            !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    // Container para critérios de senha
    const criteriaContainer = document.createElement('div');
    criteriaContainer.id = 'password-criteria';
    criteriaContainer.style.cssText = `
        font-size: 14px;
        margin-top: 8px;
        display: none;
    `;
    
    const criteriaList = document.createElement('ul');
    criteriaList.style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0;
    `;
    
    // Inserir container após o campo de senha
    senhaInput.parentNode.insertBefore(criteriaContainer, senhaInput.nextSibling);
    criteriaContainer.appendChild(criteriaList);
    
    // Validar estado do formulário
    function validarFormulario() {
        const nome = nomeInput.value.trim();
        const nascimento = nascimentoInput.value.trim();
        const telefone = obterNumerosPuros(telefoneInput.value);
        const cpf = obterNumerosPuros(cpfInput.value);
        const email = emailInput.value.trim();
        const senha = senhaInput.value;
        const confirmSenha = confirmSenhaInput.value;
        
        const nomeValido = nome !== '';
        const nascimentoValido = nascimento !== '';
        const telefoneValido = telefone.length >= 10; // Mínimo 10 dígitos
        const cpfValido = cpf.length === 11; // Exatamente 11 dígitos
        const emailValido = AuthUtils.validarEmail(email);
        const senhaValida = atualizarCriteriosSenha();
        const senhasIguais = senha === confirmSenha && confirmSenha !== '';
        
        // Limpar mensagens de erro específicas
        const nomeError = document.getElementById('nome-error');
        const nascimentoError = document.getElementById('nascimento-error');
        const telefoneError = document.getElementById('telefone-error');
        const cpfError = document.getElementById('cpf-error');
        const emailError = document.getElementById('email-error');
        const confirmError = document.getElementById('confirm-senha-error');
        
        if (nomeError) nomeError.style.display = 'none';
        if (nascimentoError) nascimentoError.style.display = 'none';
        if (telefoneError) telefoneError.style.display = 'none';
        if (cpfError) cpfError.style.display = 'none';
        if (emailError) emailError.style.display = 'none';
        if (confirmError) confirmError.style.display = 'none';
        
        // Mostrar erros específicos se necessário
        if (telefoneInput.value && !telefoneValido) {
            if (telefoneError) {
                telefoneError.textContent = 'Telefone deve ter pelo menos 10 dígitos';
                telefoneError.style.display = 'block';
            }
        }
        
        if (cpfInput.value && !cpfValido) {
            if (cpfError) {
                cpfError.textContent = 'CPF deve ter exatamente 11 dígitos';
                cpfError.style.display = 'block';
            }
        }
        
        // Habilitar/desabilitar botão
        const formValido = nomeValido && nascimentoValido && telefoneValido && cpfValido && emailValido && senhaValida && senhasIguais;
        btnCadastrar.disabled = !formValido;
        
        return formValido;
    }
    
    // Event listeners para validação em tempo real
    nomeInput.addEventListener('input', validarFormulario);
    nascimentoInput.addEventListener('input', validarFormulario);
    emailInput.addEventListener('input', validarFormulario);
    senhaInput.addEventListener('input', validarFormulario);
    confirmSenhaInput.addEventListener('input', validarFormulario);
    
    // Estado inicial
    btnCadastrar.disabled = true;
    
    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validação final
        if (!validarFormulario()) {
            AuthUtils.mostrarMensagem('Por favor, corrija os erros do formulário', 'erro');
            return;
        }
        
        const nome = nomeInput.value.trim().toLowerCase();
        const nascimento = nascimentoInput.value.trim();
        const telefone = obterNumerosPuros(telefoneInput.value); // Apenas números
        const cpf = obterNumerosPuros(cpfInput.value); // Apenas números
        
        // Estado do botão
        const textoOriginal = btnCadastrar.textContent;
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'Cadastrando...';
        
        try {
            const response = await fetch('/api/user/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name: nome, 
                    phone: telefone, // Enviando apenas números
                    birth: nascimento,
                    cpf: cpf // Enviando apenas números
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('❌ Erro no cadastro:', result.error);
                AuthUtils.mostrarMensagem(result.error, 'erro');
            } else {
                AuthUtils.mostrarMensagem('🎉 Verifique sua caixa de e-mail para concluir o cadastro!', 'sucesso');
                form.reset(); // Limpar o formulário
            }
        } catch (error) {
            console.error('❌ Erro crítico:', error);
            AuthUtils.mostrarMensagem('Erro inesperado. Tente novamente.', 'erro');
        } finally {
            btnCadastrar.disabled = false;
            btnCadastrar.textContent = textoOriginal;
        }
    });
});