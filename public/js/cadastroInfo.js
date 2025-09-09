document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.querySelector('form');
    
    // Form Sections
    const personalDataSection = document.getElementById('personal-data-section');
    const addressSection = document.getElementById('address-section');

    // Navigation Buttons
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnCadastrar = document.getElementById('btn-cadastrar');

    // Personal Data Fields
    const nomeInput = document.getElementById('cadastro-nome');
    const nascimentoInput = document.getElementById('cadastro-nascimento');
    const telefoneInput = document.getElementById('cadastro-telefone');
    const cpfInput = document.getElementById('cadastro-cpf');
    
    // Address Fields
    const cepInput = document.getElementById('cadastro-cep');
    const ruaInput = document.getElementById('cadastro-rua');
    const numeroInput = document.getElementById('cadastro-numero');
    const complementoInput = document.getElementById('cadastro-complemento');
    const bairroInput = document.getElementById('cadastro-bairro');
    const cidadeInput = document.getElementById('cadastro-cidade');
    const estadoInput = document.getElementById('cadastro-estado');
    
    if (!form) return;

    // Formatting Functions (CPF, Phone, CEP)
    const formatarCPF = (v) => v.replace(/\D/g, '').substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    const formatarTelefone = (v) => v.replace(/\D/g, '').substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    const formatarCEP = (v) => v.replace(/\D/g, '').substring(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
    const obterNumerosPuros = (v) => v.replace(/\D/g, '');

    // Input Formatting Listeners
    cpfInput.addEventListener('input', () => { cpfInput.value = formatarCPF(cpfInput.value); validarPrimeiraSecao(); });
    telefoneInput.addEventListener('input', () => { telefoneInput.value = formatarTelefone(telefoneInput.value); validarPrimeiraSecao(); });
    cepInput.addEventListener('input', () => {
        cepInput.value = formatarCEP(cepInput.value);
        if (obterNumerosPuros(cepInput.value).length === 8) buscarEnderecoPorCEP(cepInput.value);
        validarSegundaSecao();
    });

    // Fetch address from CEP
    async function buscarEnderecoPorCEP(cep) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${obterNumerosPuros(cep)}/json/`);
            const data = await response.json();
            if (!data.erro) {
                ruaInput.value = data.logradouro;
                bairroInput.value = data.bairro;
                cidadeInput.value = data.localidade;
                estadoInput.value = data.uf;
                numeroInput.focus();
            } else {
                AuthUtils.mostrarMensagem('CEP não encontrado.', 'erro');
            }
        } catch (error) {
            AuthUtils.mostrarMensagem('Não foi possível buscar o CEP.', 'erro');
        } finally {
            validarSegundaSecao();
        }
    }
    
    // Validation Functions
    const validarPrimeiraSecao = () => {
        const secaoValida = nomeInput.value.trim() && nascimentoInput.value && obterNumerosPuros(telefoneInput.value).length >= 10 && obterNumerosPuros(cpfInput.value).length === 11;
        btnNext.disabled = !secaoValida;
        return secaoValida;
    };
    const validarSegundaSecao = () => {
        const secaoValida = obterNumerosPuros(cepInput.value).length === 8 && ruaInput.value.trim() && numeroInput.value.trim() && bairroInput.value.trim() && cidadeInput.value.trim() && estadoInput.value.trim();
        btnCadastrar.disabled = !secaoValida;
        return secaoValida;
    };
    
    // Real-time validation listeners
    [nomeInput, nascimentoInput].forEach(i => i.addEventListener('input', validarPrimeiraSecao));
    [ruaInput, numeroInput, bairroInput, cidadeInput, estadoInput].forEach(i => i.addEventListener('input', validarSegundaSecao));

    // Section Navigation
    btnNext.addEventListener('click', () => {
        if (validarPrimeiraSecao()) {
            personalDataSection.classList.remove('active');
            addressSection.classList.add('active');
        }
    });
    btnPrev.addEventListener('click', () => {
        addressSection.classList.remove('active');
        personalDataSection.classList.add('active');
    });

    // Initial State
    validarPrimeiraSecao();
    validarSegundaSecao();
    
    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validarPrimeiraSecao() || !validarSegundaSecao()) {
            return AuthUtils.mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'erro');
        }
        
        const dadosCadastro = {
            nome: nomeInput.value.trim(),
            nascimento: nascimentoInput.value.trim(),
            telefone: obterNumerosPuros(telefoneInput.value),
            cpf: obterNumerosPuros(cpfInput.value),
            endereco: {
                cep: obterNumerosPuros(cepInput.value),
                logradouro: ruaInput.value.trim(),
                numero: numeroInput.value.trim(),
                complemento: complementoInput.value.trim(),
                bairro: bairroInput.value.trim(),
                cidade: cidadeInput.value.trim(),
                estado: estadoInput.value.trim().toUpperCase()
            }
        };

        const textoOriginal = btnCadastrar.textContent;
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = 'Salvando...';
        

        try {
            const response = await fetch('/perfil/completar', { // <-- UPDATED ENDPOINT
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCadastro),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocorreu um erro ao salvar o perfil.');
            }
            
            AuthUtils.mostrarMensagem('🎉 Dados salvos com sucesso!', 'sucesso');
            // Redirect to the dashboard after a short delay
            setTimeout(() => { window.location.href = '/inicio'; }, 1500);

        } catch (error) {
            AuthUtils.mostrarMensagem(error.message, 'erro');
            btnCadastrar.disabled = false;
            btnCadastrar.textContent = textoOriginal;
        }
    });
});