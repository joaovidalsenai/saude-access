// Script para atualizar o valor do range
const rangeSlider = document.getElementById('raio-range');
const rangeValue = document.querySelector('.range-value');

rangeSlider.addEventListener('input', function () {
    rangeValue.textContent = this.value + ' km';
});

document.addEventListener('DOMContentLoaded', function () {
    const temaToggle = document.getElementById('tema-toggle');
    // ... código do tema ...
    temaToggle.addEventListener('change', mudarTema);

    const modalEmail = document.getElementById('modal-email');
    const btnCancelarEmail = document.getElementById('btn-cancelar-email');
    const btnConfirmarEmail = document.getElementById('btn-confirmar-email');
    const novoEmailInput = document.getElementById('novo-email-input');
    const emailChangeError = document.getElementById('email-change-error');

    // --- Lógica de Abertura (Botão "Alterar E-mail" na página de configurações) ---
    const btnAlterarEmail = document.getElementById('item-alterar-email');
    if (btnAlterarEmail) {
        btnAlterarEmail.addEventListener('click', async () => {
            // --- ETAPA 1: Reautenticação por Senha (Igual antes) ---
            const currentPassword = prompt("Para alterar seu e-mail, por favor, confirme sua senha atual:");
            if (!currentPassword) return;

            let reauthSuccess = false;
            try {
                const reauthResponse = await fetch('/api/verifyPassword', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword: currentPassword })
                });
                const reauthResult = await reauthResponse.json();
                reauthSuccess = reauthResponse.ok && reauthResult.success;
            } catch (error) {
                reauthSuccess = false;
            }

            // --- ETAPA 2: Abrir o Modal de E-mail se a senha estiver correta ---
            if (reauthSuccess) {
                // Limpar campo de input e erros anteriores
                novoEmailInput.value = '';
                emailChangeError.textContent = '';
                // Abrir o modal
                modalEmail.classList.remove('hidden');
            } else {
                alert("Senha incorreta. A alteração foi cancelada.");
            }
        });
    }

    // --- Lógica dos Botões Dentro do Modal de E-mail ---

    // Botão Cancelar do modal de e-mail
    btnCancelarEmail?.addEventListener('click', () => {
        // --- ADICIONE ESTE LOG ---
        modalEmail.classList.add('hidden');
    });

    // Botão Confirmar do modal de e-mail
    btnConfirmarEmail?.addEventListener('click', async () => {
        // --- ADICIONE ESTE LOG ---

        const novoEmail = novoEmailInput.value.trim();

        // Validação de formato
        if (!AuthUtils.validarEmail(novoEmail)) {
            emailChangeError.textContent = "Formato de e-mail inválido.";
            return;
        }

        // Desabilitar botão para evitar cliques duplos
        btnConfirmarEmail.disabled = true;
        btnConfirmarEmail.textContent = "Salvando...";

        // Chamar a API para alterar o e-mail
        try {
            const response = await fetch('/api/changeEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmail: novoEmail })
            });
            const result = await response.json();

            if (response.ok) { //
                alert(result.message);
                modalEmail.classList.add('hidden'); // Fechar modal em sucesso
            } else {
                emailChangeError.textContent = result.error; // Mostrar erro da API no modal
            }
        } catch (error) {
            emailChangeError.textContent = "Erro de conexão. Tente novamente."; //
        } finally {
            // Reabilitar botão
            btnConfirmarEmail.disabled = false;
            btnConfirmarEmail.textContent = "Salvar Alteração";
        }
    });

    // --- CÓDIGO PARA ABRIR O MODAL ---
    const btnAbrirModalSenha = document.getElementById("item-alterar-senha");
    const modal = document.getElementById("modal-senha");

    if (btnAbrirModalSenha && modal) {
        btnAbrirModalSenha.addEventListener("click", async () => {
            const currentPassword = prompt("Para sua segurança, por favor, digite sua senha atual:");

            if (!currentPassword) {
                console.log("Verificação cancelada pelo usuário.");
                return;
            }

            try {
                const response = await fetch('/api/verifyPassword', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword: currentPassword })
                });

                const result = await response.json();

                if (response.ok === true && result.success === true) {
                    // Caminho A: Sucesso
                    modal.classList.remove("hidden");
                } else {
                    // Caminho B: Falha
                    alert("Senha incorreta ou erro na verificação: " + (result.error || "Tente novamente."));
                }

            } catch (error) {
                console.error("ERRO CRÍTICO no bloco catch:", error);
                alert("Ocorreu um erro inesperado na comunicação com o servidor.");
            }
        });
    }

    const novaSenhaInput = document.getElementById('nova-senha');
    const criteriosLista = {
        length: document.getElementById('criterio-length'),
        uppercase: document.getElementById('criterio-uppercase'),
        lowercase: document.getElementById('criterio-lowercase'),
        number: document.getElementById('criterio-number'),
        special: document.getElementById('criterio-special')
    };

    // Listener para o evento de digitação no campo de nova senha
    if (novaSenhaInput) {
        novaSenhaInput.addEventListener('input', () => {
            const senha = novaSenhaInput.value;
            const validacaoResultado = AuthUtils.validarSenha(senha); // 

            // Mapear resultados para a UI com base na ordem dos critérios em auth-utils.js 
            atualizarCriterioUI(criteriosLista.length, validacaoResultado.criterios[0].atende);
            atualizarCriterioUI(criteriosLista.uppercase, validacaoResultado.criterios[1].atende);
            atualizarCriterioUI(criteriosLista.lowercase, validacaoResultado.criterios[2].atende);
            atualizarCriterioUI(criteriosLista.number, validacaoResultado.criterios[3].atende);
            atualizarCriterioUI(criteriosLista.special, validacaoResultado.criterios[4].atende);
        });
    }

    /**
     * Atualiza a classe de um elemento da lista de critérios (valido/invalido).
     * @param {HTMLElement} elementoLi - O item da lista (<li>) a ser atualizado.
     * @param {boolean} atende - Se o critério foi atendido ou não.
     */
    // Substitua pela versão abaixo (adicionando "if (elementoLi)"):
    function atualizarCriterioUI(elementoLi, atende) {
        if (elementoLi) { // <-- ADICIONE ESTA VERIFICAÇÃO
            if (atende) {
                elementoLi.classList.add('valido');
            } else {
                elementoLi.classList.remove('valido');
            }
        }
    }

    // --- LÓGICA EXISTENTE DO MODAL (Cancelar/Confirmar) ---
    const btnCancelar = document.getElementById("btn-cancelar");
    const btnConfirmar = document.getElementById("btn-confirmar");

    btnCancelar?.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    btnConfirmar?.addEventListener("click", async () => {
        const novaSenha = document.getElementById("nova-senha").value;
        const confirmarSenha = document.getElementById("confirmar-senha").value;

        const validacaoResultado = AuthUtils.validarSenha(novaSenha);

        if (!validacaoResultado.valida) {
            // Encontrar o primeiro critério que falhou para exibir uma mensagem específica
            let mensagemErro = "A senha não atende aos requisitos mínimos."; // Mensagem padrão

            const criterioFalho = validacaoResultado.criterios.find(criterio => !criterio.atende);
            if (criterioFalho) {
                mensagemErro = `A senha precisa ter: ${criterioFalho.texto}.`;
            }

            // Usar a função mostrarMensagem do próprio auth-utils para exibir o erro
            AuthUtils.mostrarMensagem(mensagemErro, 'erro');
            return; // Para a execução
        }


        if (novaSenha !== confirmarSenha) {
            alert("As senhas não coincidem.");
            return;
        }

        try {
            const response = await fetch("/api/changePassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: novaSenha })
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ " + data.message);
                modal.classList.add("hidden");
                document.getElementById("nova-senha").value = "";
                document.getElementById("confirmar-senha").value = "";
            } else {
                alert("❌ Erro: " + data.error);
            }
        } catch (error) {
            alert("❌ Erro inesperado: " + error.message);
        }
    });
});

function mudarTema() {
    const html = document.documentElement;
    const temaToggle = document.getElementById('tema-toggle');

    if (temaToggle.checked) {
        html.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        html.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    }
}
