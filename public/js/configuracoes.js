// Script para atualizar o valor do range
const rangeSlider = document.getElementById('raio-range');
const rangeValue = document.querySelector('.range-value');

rangeSlider.addEventListener('input', function () {
    rangeValue.textContent = this.value + ' km';
});

document.addEventListener('DOMContentLoaded', function () {
    const temaToggle = document.getElementById('tema-toggle');

    // Lógica do tema (sem alterações)
    const temaSalvo = localStorage.getItem('theme');
    if (temaSalvo) {
        document.documentElement.setAttribute('data-theme', temaSalvo);
        if (temaSalvo === 'dark') {
            temaToggle.checked = true;
        } else {
            temaToggle.checked = false;
        }
    }
    temaToggle.addEventListener('change', mudarTema);

    // ======================================================
    // =========== INÍCIO: LÓGICA REESTRUTURADA ===========
    // ======================================================

    // --- Seletores dos Modais ---
    const modalEmail = document.getElementById('modal-email');
    const modalSenha = document.getElementById("modal-senha");
    const modalReauth = document.getElementById('modal-reauth');
    const modalNotificacao = document.getElementById('modal-notificacao');

    // --- Elementos do Modal de Notificação ---
    const notificacaoTitulo = document.getElementById('notificacao-titulo'); // <-- NOVO
    const notificacaoMensagem = document.getElementById('notificacao-mensagem'); // <-- NOVO
    const btnFecharNotificacao = document.getElementById('btn-fechar-notificacao'); // <-- NOVO

    // --- Função para exibir o modal de notificação ---
    function mostrarNotificacao(titulo, mensagem) {
        if (notificacaoTitulo && notificacaoMensagem && modalNotificacao) {
            notificacaoTitulo.textContent = titulo;
            notificacaoMensagem.textContent = mensagem;
            modalNotificacao.classList.remove('hidden');
        }
    }

    // --- Lógica para fechar o modal de notificação ---
    btnFecharNotificacao?.addEventListener('click', () => {
        modalNotificacao.classList.add('hidden');
    });
    
    // --- Seletores dos Botões de Ação na Página Principal ---
    const btnAlterarEmail = document.getElementById('item-alterar-email');
    const btnAbrirModalSenha = document.getElementById("item-alterar-senha");

    // --- Elementos do Modal de Reautenticação ---
    const btnConfirmarReauth = document.getElementById('btn-confirmar-reauth');
    const btnCancelarReauth = document.getElementById('btn-cancelar-reauth');
    const currentPasswordInput = document.getElementById('current-password-input');
    const reauthError = document.getElementById('reauth-error');

    // Variável para saber qual modal abrir após a senha ser confirmada
    let acaoPendente = null; 

    // --- Lógica para ABRIR o modal de reautenticação ---

    // 1. Ao clicar em "Alterar Senha"
    btnAbrirModalSenha?.addEventListener("click", () => {
        acaoPendente = 'senha'; // Guarda a ação que o usuário quer fazer
        reauthError.textContent = ''; // Limpa erros antigos
        currentPasswordInput.value = ''; // Limpa o campo de senha
        modalReauth.classList.remove("hidden"); // Abre o modal para pedir a senha atual
        currentPasswordInput.focus();
    });

    // 2. Ao clicar em "Alterar E-mail"
    btnAlterarEmail?.addEventListener('click', () => {
        acaoPendente = 'email'; // Guarda a ação que o usuário quer fazer
        reauthError.textContent = ''; // Limpa erros antigos
        currentPasswordInput.value = ''; // Limpa o campo de senha
        modalReauth.classList.remove('hidden'); // Abre o modal para pedir a senha atual
        currentPasswordInput.focus();
    });

    // --- Lógica dos botões DENTRO do modal de reautenticação ---

    // Botão Cancelar
    btnCancelarReauth?.addEventListener('click', () => {
        modalReauth.classList.add('hidden');
        acaoPendente = null; // Limpa a ação pendente
    });

    // Botão Confirmar (lógica principal de verificação)
    btnConfirmarReauth?.addEventListener('click', async () => {
        const currentPassword = currentPasswordInput.value;

        if (!currentPassword) {
            reauthError.textContent = "Por favor, digite sua senha atual.";
            return;
        }

        // Feedback visual para o usuário
        btnConfirmarReauth.disabled = true;
        btnConfirmarReauth.textContent = "Verificando...";
        reauthError.textContent = "";

        try {
            const response = await fetch('/auth/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: currentPassword })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Senha correta!
                modalReauth.classList.add("hidden");

                // Agora, executa a ação que estava pendente
                if (acaoPendente === 'senha') {
                    modalSenha.classList.remove("hidden");
                } else if (acaoPendente === 'email') {
                    document.getElementById('novo-email-input').value = '';
                    document.getElementById('email-change-error').textContent = '';
                    modalEmail.classList.remove('hidden');
                }
                acaoPendente = null; // Limpa a ação
            } else {
                // Senha incorreta
                reauthError.textContent = result.error || "Senha incorreta. Tente novamente.";
            }
        } catch (error) {
            console.error("ERRO CRÍTICO no bloco catch:", error);
            reauthError.textContent = "Ocorreu um erro de conexão. Tente novamente.";
        } finally {
            // Restaura o botão
            btnConfirmarReauth.disabled = false;
            btnConfirmarReauth.textContent = "Confirmar";
        }
    });

    // --- O RESTANTE DO SEU CÓDIGO (LÓGICA DOS MODAIS DE ALTERAÇÃO) ---
    // A lógica interna dos modais de alterar e-mail e senha continua praticamente a mesma,
    // pois a verificação já foi feita.

    // --- Lógica do Modal de E-mail ---
    const btnCancelarEmail = document.getElementById('btn-cancelar-email');
    const btnConfirmarEmail = document.getElementById('btn-confirmar-email');
    
    btnCancelarEmail?.addEventListener('click', () => modalEmail.classList.add('hidden'));
    
    btnConfirmarEmail?.addEventListener('click', async () => {
        const novoEmailInput = document.getElementById('novo-email-input');
        const emailChangeError = document.getElementById('email-change-error');
        const novoEmail = novoEmailInput.value.trim();

        if (!AuthUtils.validarEmail(novoEmail)) {
            emailChangeError.textContent = "Formato de e-mail inválido.";
            return;
        }

        btnConfirmarEmail.disabled = true;
        btnConfirmarEmail.textContent = "Salvando...";

        try {
            const response = await fetch('/auth/alterar/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmail: novoEmail })
            });
            const result = await response.json();

            if (response.ok) {
                modalEmail.classList.add('hidden');
                mostrarNotificacao('Sucesso!', result.message); 
            } else {
                emailChangeError.textContent = result.error;
            }
        } catch (error) {
            emailChangeError.textContent = "Erro de conexão. Tente novamente.";
        } finally {
            btnConfirmarEmail.disabled = false;
            btnConfirmarEmail.textContent = "Salvar Alteração";
        }
    });

    // --- Lógica do Modal de Senha (validação de critérios, etc.) ---
    // (Esta parte do seu código permanece a mesma)
    const novaSenhaInput = document.getElementById('nova-senha');
    const criteriosLista = {
        length: document.getElementById('criterio-length'),
        uppercase: document.getElementById('criterio-uppercase'),
        lowercase: document.getElementById('criterio-lowercase'),
        number: document.getElementById('criterio-number'),
        special: document.getElementById('criterio-special')
    };

    if (novaSenhaInput) {
        novaSenhaInput.addEventListener('input', () => {
            const senha = novaSenhaInput.value;
            const validacaoResultado = AuthUtils.validarSenha(senha);
            atualizarCriterioUI(criteriosLista.length, validacaoResultado.criterios[0].atende);
            atualizarCriterioUI(criteriosLista.uppercase, validacaoResultado.criterios[1].atende);
            atualizarCriterioUI(criteriosLista.lowercase, validacaoResultado.criterios[2].atende);
            atualizarCriterioUI(criteriosLista.number, validacaoResultado.criterios[3].atende);
            atualizarCriterioUI(criteriosLista.special, validacaoResultado.criterios[4].atende);
        });
    }

    function atualizarCriterioUI(elementoLi, atende) {
        if (elementoLi) {
            elementoLi.classList.toggle('valido', atende);
        }
    }

    const btnCancelarSenha = document.getElementById("btn-cancelar");
    const btnConfirmarSenha = document.getElementById("btn-confirmar");

    btnCancelarSenha?.addEventListener("click", () => modalSenha.classList.add("hidden"));

    btnConfirmarSenha?.addEventListener("click", async () => {
        const novaSenha = document.getElementById("nova-senha").value;
        const confirmarSenha = document.getElementById("confirmar-senha").value;

        const validacaoResultado = AuthUtils.validarSenha(novaSenha);
        if (!validacaoResultado.valida) {
            const criterioFalho = validacaoResultado.criterios.find(c => !c.atende);
            const mensagemErro = criterioFalho ? `A senha precisa ter: ${criterioFalho.texto}.` : "A senha não atende aos requisitos.";
            AuthUtils.mostrarMensagem(mensagemErro, 'erro');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            mostrarNotificacao("Incorreto", "As senhas não coincidem");
            return;
        }

        try {
            const response = await fetch("/auth/alterar/senha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: novaSenha })
            });
            const data = await response.json();
            if (response.ok) {
                modalSenha.classList.add("hidden");
                document.getElementById("nova-senha").value = "";
                document.getElementById("confirmar-senha").value = "";
                mostrarNotificacao("Sucesso!", data.message);
            } else {
                mostrarNotificacao("Erro", data.error);
            }
        } catch (error) {
            mostrarNotificacao("Erro inesperado", error.message);
        }
    });

});

function mudarTema() {
    const html = document.documentElement;
    const temaToggle = document.getElementById('tema-toggle');
    const tema = temaToggle.checked ? "dark" : "light";
    html.setAttribute("data-theme", tema);
    localStorage.setItem("theme", tema);
}