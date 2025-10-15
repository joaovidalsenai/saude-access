// public/js/recuperarSenha.js

async function solicitarRecuperacao(event) {
    event.preventDefault();
    
    const email = document.getElementById('recuperar-email').value.trim();
    const botaoEnviar = document.querySelector('.btn-enviar');

    // Validação de frontend
    if (!email) {
        AuthUtils.mostrarMensagem('Por favor, insira seu e-mail.', 'erro');
        return;
    }
    if (!AuthUtils.validarEmail(email)) {
        AuthUtils.mostrarMensagem('Formato de e-mail inválido.', 'erro');
        return;
    }
    
    const textoOriginal = botaoEnviar.textContent;
    botaoEnviar.disabled = true;
    botaoEnviar.textContent = 'Enviando...';
    
    try {
        console.log('📨 Solicitando link de recuperação via backend...');
        
        const response = await fetch('/auth/recuperar-senha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Erro na solicitação:', result.error);
            AuthUtils.mostrarMensagem(result.error || 'Ocorreu um erro.', 'erro');
        } else {
            console.log('✅ Solicitação enviada com sucesso!');
            // Mensagem genérica por segurança, para não confirmar se um e-mail existe no banco de dados.
            AuthUtils.mostrarMensagem('Se este e-mail estiver cadastrado, um link de recuperação foi enviado.', 'sucesso');
            document.getElementById('formRecuperarSenha').reset(); // Limpa o formulário
        }
        
    } catch (error) {
        console.error('❌ Erro crítico:', error);
        AuthUtils.mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    } finally {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = textoOriginal;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const formRecuperar = document.getElementById('formRecuperarSenha');
    if (formRecuperar) {
        formRecuperar.addEventListener('submit', solicitarRecuperacao);
    } else {
        console.error('❌ Formulário de recuperação não encontrado!');
    }
});