// public/js/cadastro.js
// Versão refatorada usando auth-utils e Supabase direto

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const form = document.querySelector('form');
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
        const email = emailInput.value.trim();
        const senha = senhaInput.value;
        const confirmSenha = confirmSenhaInput.value;
        
        const emailValido = AuthUtils.validarEmail(email);
        const senhaValida = atualizarCriteriosSenha();
        const senhasIguais = senha === confirmSenha && confirmSenha !== '';
        
        // Limpar mensagens de erro específicas
        const emailError = document.getElementById('email-error');
        const confirmError = document.getElementById('confirm-senha-error');
        
        if (emailError) emailError.style.display = 'none';
        if (confirmError) confirmError.style.display = 'none';
        
        // Mostrar erros específicos
        if (email && !emailValido && emailError) {
            emailError.textContent = 'Por favor, insira um e-mail válido.';
            emailError.style.display = 'block';
        }
        
        if (confirmSenha && !senhasIguais && confirmError) {
            confirmError.textContent = 'As senhas não coincidem.';
            confirmError.style.display = 'block';
        }
        
        // Habilitar/desabilitar botão
        btnCadastrar.disabled = !(emailValido && senhaValida && senhasIguais);
        
        return emailValido && senhaValida && senhasIguais;
    }
    
    // Event listeners para validação em tempo real
    emailInput.addEventListener('input', validarFormulario);
    senhaInput.addEventListener('input', validarFormulario);
    confirmSenhaInput.addEventListener('input', validarFormulario);
    
    // Estado inicial
    btnCadastrar.disabled = true;
    
    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const senha = senhaInput.value;
        
        // Validação final
        if (!validarFormulario()) {
            AuthUtils.mostrarMensagem('Por favor, corrija os erros do formulário', 'erro');
            return;
        }
        
        // Estado do botão
        const textoOriginal = btnCadastrar.textContent;
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'Cadastrando...';
        
        try {
            // Inicializar Supabase
            const initialized = await AuthUtils.initSupabase();
            if (!initialized) {
                return;
            }
            
            console.log('📝 Tentando fazer cadastro...');
            
            // Cadastro via Supabase
            const supabase = AuthUtils.getSupabase();
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: senha,
            });
            
            if (error) {
                console.error('❌ Erro no cadastro:', error.message);
                const mensagemTraduzida = AuthUtils.traduzirErroSupabase(error);
                
                // Se for email já cadastrado, mostrar no campo específico
                if (error.message.includes('User already registered')) {
                    const emailError = document.getElementById('email-error');
                    if (emailError) {
                        emailError.textContent = 'Este e-mail já está cadastrado. Por favor, tente fazer login.';
                        emailError.style.display = 'block';
                    }
                } else {
                    AuthUtils.mostrarMensagem(mensagemTraduzida, 'erro');
                }
            } else {
                console.log('✅ Cadastro realizado com sucesso!');
                AuthUtils.mostrarMensagem('🎉 Verifique sua caixa de e-mail para concluir o cadastro!', 'sucesso');
                
                // Limpar formulário
                emailInput.value = '';
                senhaInput.value = '';
                confirmSenhaInput.value = '';
                criteriaContainer.style.display = 'none';
                validarFormulario();
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