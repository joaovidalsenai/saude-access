const senhaInput = document.getElementById('cadastro-senha');
const confirmSenhaInput = document.getElementById('cadastro-confirm-senha');
const emailInput = document.getElementById('cadastro-email');
const btnCadastrar = document.getElementById('btn-cadastrar');

// Elementos dos requisitos
const reqTamanho = document.getElementById('req-tamanho');
const reqMaiuscula = document.getElementById('req-maiuscula');
const reqMinuscula = document.getElementById('req-minuscula');
const reqNumero = document.getElementById('req-numero');
const reqEspecial = document.getElementById('req-especial');

function validarSenha() {
    const senha = senhaInput.value;

    // Verificar tamanho
    if (senha.length >= 8) {
        reqTamanho.classList.add('valido');
    } else {
        reqTamanho.classList.remove('valido');
    }

    // Verificar maiúscula
    if (/[A-Z]/.test(senha)) {
        reqMaiuscula.classList.add('valido');
    } else {
        reqMaiuscula.classList.remove('valido');
    }

    // Verificar minúscula
    if (/[a-z]/.test(senha)) {
        reqMinuscula.classList.add('valido');
    } else {
        reqMinuscula.classList.remove('valido');
    }

    // Verificar número
    if (/[0-9]/.test(senha)) {
        reqNumero.classList.add('valido');
    } else {
        reqNumero.classList.remove('valido');
    }

    // Verificar caractere especial
    if (/[@$!%*?&]/.test(senha)) {
        reqEspecial.classList.add('valido');
    } else {
        reqEspecial.classList.remove('valido');
    }

    verificarFormCompleto();
}

function verificarFormCompleto() {
    const email = emailInput.value;
    const senha = senhaInput.value;
    const confirmSenha = confirmSenhaInput.value;

    // Verificar se email é válido
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Verificar se senha atende todos os requisitos
    const senhaValida = senha.length >= 8 &&
        /[A-Z]/.test(senha) &&
        /[a-z]/.test(senha) &&
        /[0-9]/.test(senha) &&
        /[@$!%*?&]/.test(senha);

    // Verificar se senhas coincidem
    const senhasIguais = senha === confirmSenha && confirmSenha !== '';

    // Habilitar/desabilitar botão
    if (emailValido && senhaValida && senhasIguais) {
        btnCadastrar.disabled = false;
    } else {
        btnCadastrar.disabled = true;
    }
}

// Event listeners
senhaInput.addEventListener('input', validarSenha);
confirmSenhaInput.addEventListener('input', verificarFormCompleto);
emailInput.addEventListener('input', verificarFormCompleto);

// Inicializar estado do botão
btnCadastrar.disabled = true;

// Validação do formulário
document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = emailInput.value;
    const senha = senhaInput.value;
    const confirmSenha = confirmSenhaInput.value;

    if (!email || !senha || !confirmSenha) {
        return;
    }

    if (senha !== confirmSenha) {
        alert('As senhas não coincidem.');
        return;
    }

    try {
        const response = await fetch('/api/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        })

        const result = await response.json()
        
        if (result.success) {
            alert('Verifique sua caixa de email para concluir o cadastro!')
        } else {
            alert('Erro no cadastro: ' + result.error)
        }
    } catch (error) {
        alert('Erro inesperado: ' + error.message)
    }
});