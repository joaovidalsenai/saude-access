// public/js/cadastro.js
// Versão refatorada usando auth-utils e Supabase direto

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const form = document.querySelector('form');
    const nomeInput = document.getElementById('cadastro-nome');
    const nascimentoInput = document.getElementById('cadastro-nascimento');
    const telefoneInput = document.getElementById('cadastro-telefone');
    const emailInput = document.getElementById('cadastro-email');
    const senhaInput = document.getElementById('cadastro-senha');
    const confirmSenhaInput = document.getElementById('cadastro-confirm-senha');
    const btnCadastrar = document.getElementById('btn-cadastrar');
    
    if (!senhaInput || !form) return;
    
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
    
    // Atualizar critérios visuais
    function atualizarCriteriosSenha() {
        const senha = senhaInput.value;
        const validacao = AuthUtils.validarSenha(senha);
        
        // Limpar lista
        criteriaList.innerHTML = '';
        
        // Recriar critérios
        validacao.criterios.forEach(criterio => {
            const li = document.createElement('li');
            li.textContent = criterio.texto;
            li.style.cssText = `
                margin: 4px 0;
                color: ${criterio.atende ? '#2ecc71' : '#e74c3c'};
            `;
            criteriaList.appendChild(li);
        });
        
        // Mostrar/ocultar container
        criteriaContainer.style.display = senha.length > 0 ? 'block' : 'none';
        
        return validacao.valida;
    }
    
    // Validar estado do formulário
    function validarFormulario() {
        const nome = nomeInput.value.trim();
        const nascimento = nascimentoInput.value.trim();
        const telefone = telefoneInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value;
        const confirmSenha = confirmSenhaInput.value;
        
        const nomeValido = nome !== '';
        const nascimentoValido = nascimento !== '';
        const telefoneValido = telefone !== '';
        const emailValido = AuthUtils.validarEmail(email);
        const senhaValida = atualizarCriteriosSenha();
        const senhasIguais = senha === confirmSenha && confirmSenha !== '';
        
        // Limpar mensagens de erro específicas
        const nomeError = document.getElementById('nome-error');
        const nascimentoError = document.getElementById('nascimento-error');
        const telefoneError = document.getElementById('telefone-error');
        const emailError = document.getElementById('email-error');
        const confirmError = document.getElementById('confirm-senha-error');
        
        if (nomeError) nomeError.style.display = 'none';
        if (nascimentoError) nascimentoError.style.display = 'none';
        if (telefoneError) telefoneError.style.display = 'none';
        if (emailError) emailError.style.display = 'none';
        if (confirmError) confirmError.style.display = 'none';
        
        // Habilitar/desabilitar botão
        const formValido = nomeValido && nascimentoValido && telefoneValido && emailValido && senhaValida && senhasIguais;
        btnCadastrar.disabled = !formValido;
        
        return formValido;
    }
    
    // Event listeners para validação em tempo real
    nomeInput.addEventListener('input', validarFormulario);
    nascimentoInput.addEventListener('input', validarFormulario);
    telefoneInput.addEventListener('input', validarFormulario);
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
        
        const nome = nomeInput.value.trim();
        const nascimento = nascimentoInput.value.trim();
        const telefone = telefoneInput.value.trim();
        const email = emailInput.value.trim();
        const senha = senhaInput.value;
        
        // Estado do botão
        const textoOriginal = btnCadastrar.textContent;
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'Cadastrando...';
        
        try {
            console.log('📝 Tentando fazer cadastro via backend...');

            // MUDANÇA: Chamar sua API com os novos dados
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email, 
                    password: senha, 
                    name: nome, 
                    phone: telefone,
                    birth: nascimento 
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('❌ Erro no cadastro:', result.error);
                AuthUtils.mostrarMensagem(result.error, 'erro');
            } else {
                console.log('✅ Cadastro realizado com sucesso!');
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