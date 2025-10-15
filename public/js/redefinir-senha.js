// public/js/redefinir-senha.js

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const form = document.getElementById('formRedefinirSenha');
    const senhaInput = document.getElementById('nova-senha');
    const confirmSenhaInput = document.getElementById('confirmar-nova-senha');
    const btnRedefinir = document.getElementById('btn-redefinir');
    const confirmError = document.getElementById('confirm-senha-error');
    
    let accessToken = null;

    // --- Lógica de Critérios de Senha (Reaplicada para Robustez) ---
    if (!senhaInput || !form) return;

    // 1. Criação dos elementos
    const criteriaContainer = document.createElement('div');
    criteriaContainer.id = 'password-criteria';
    criteriaContainer.style.cssText = `
        font-size: 14px;
        margin-top: 8px;
        /* Estilo para que o feedback não quebre o layout */
    `;

    const criteriaList = document.createElement('ul');
    criteriaList.style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0;
    `;
    criteriaContainer.appendChild(criteriaList);
    
    // 2. Inserção no DOM (CORRIGIDO PARA O CASO MAIS SIMPLES E SEGURO)
    // Insere o container de critérios DEPOIS do input de senha.
    // Garantia de que o nó pai (inputGroup) é usado para a inserção.
    senhaInput.parentNode.insertBefore(criteriaContainer, senhaInput.nextSibling);

    // Atualizar critérios visuais
    function atualizarCriteriosSenha() {
        // VERIFICAÇÃO CRÍTICA: Se AuthUtils não estiver disponível ou a função faltar
        if (typeof AuthUtils === 'undefined' || typeof AuthUtils.validarSenha !== 'function') {
            criteriaContainer.style.display = 'none';
            // Se não puder validar critérios, assume que não é válido por segurança, 
            // mas usa a checagem básica para dar alguma chance de usabilidade
            return senhaInput.value.length >= 8; 
        }

        const senha = senhaInput.value;
        const validacao = AuthUtils.validarSenha(senha);

        criteriaList.innerHTML = '';

        // Recriar critérios
        validacao.criterios.forEach(criterio => {
            const li = document.createElement('li');
            li.textContent = criterio.texto;
            li.style.cssText = `
                margin: 4px 0;
                color: ${criterio.atende ? '#2ecc71' : '#e74c3c'};
                transition: color 0.3s;
            `;
            criteriaList.appendChild(li);
        });

        // Mostrar/ocultar container
        criteriaContainer.style.display = senha.length > 0 ? 'block' : 'none';

        // Retorna se a senha atende a *todos* os critérios definidos em AuthUtils
        return validacao.valida;
    }
    // --- Fim da Lógica de Critérios de Senha ---

    // Recuperação do Access Token da URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    accessToken = params.get('access_token');

    if (!accessToken) {
        AuthUtils.mostrarMensagem('Token de redefinição inválido ou ausente. Por favor, solicite um novo link.', 'erro');
        btnRedefinir.disabled = true;
    }

    // Função para validar o formulário em tempo real (FOCO NA LÓGICA DO BOTÃO)
    function validarFormulario() {
        const senha = senhaInput.value;
        const confirmSenha = confirmSenhaInput.value;
        
        // 1. Validação de Critérios de Senha (chamando a função que atualiza o visual)
        const senhaValida = atualizarCriteriosSenha(); 
        
        // 2. Validação de Confirmação
        const senhasCoincidem = senha === confirmSenha && confirmSenha !== '';

        if (confirmSenhaInput.value && !senhasCoincidem) {
            confirmError.textContent = 'As senhas não coincidem.';
            confirmError.style.display = 'block';
        } else {
            confirmError.style.display = 'none';
        }
        
        // Lógica de habilitação do botão
        const formValido = senhaValida && senhasCoincidem && accessToken;
        btnRedefinir.disabled = !formValido;
        
        return formValido;
    }

    // Adiciona event listeners para os campos de senha
    senhaInput.addEventListener('input', validarFormulario);
    confirmSenhaInput.addEventListener('input', validarFormulario);
    
    // Estado inicial: Garante que a validação é executada ao carregar a página
    // Útil se o usuário tiver o token e preenchimento automático.
    validarFormulario();

    // ... (restante do código de submissão do formulário) ...

    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            AuthUtils.mostrarMensagem('Por favor, corrija os erros do formulário.', 'erro');
            return;
        }

        const novaSenha = senhaInput.value;
        const textoOriginal = btnRedefinir.textContent;
        btnRedefinir.disabled = true;
        btnRedefinir.textContent = 'Salvando...';

        try {
            const response = await fetch('/auth/redefinir-senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: accessToken,
                    novaSenha: novaSenha
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('❌ Erro ao redefinir senha:', result.error);
                AuthUtils.mostrarMensagem(result.error || 'Não foi possível redefinir sua senha. O link pode ter expirado.', 'erro');
            } else {
                AuthUtils.mostrarMensagem('🎉 Senha alterada com sucesso! Você já pode fazer login.', 'sucesso');
                setTimeout(() => {
                    window.location.href = '/login'; // Redireciona para o login
                }, 2000);
            }
        } catch (error) {
            console.error('❌ Erro crítico:', error);
            AuthUtils.mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
        } finally {
            btnRedefinir.disabled = false;
            btnRedefinir.textContent = textoOriginal;
        }
    });

});