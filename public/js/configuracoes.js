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

    // --- CÓDIGO PARA ABRIR O MODAL ---
    const btnAbrirModalSenha = document.getElementById("item-alterar-senha");
    const modal = document.getElementById("modal-senha");

    if (btnAbrirModalSenha && modal) {
        btnAbrirModalSenha.addEventListener("click", async () => {
            console.log("--- INÍCIO DA VERIFICAÇÃO DE SENHA ---");
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

                // --- DEPURAÇÃO NÍVEL FINAL ---
                console.log("Status da Resposta:", response.status);
                console.log("Response OK:", response.ok);
                console.log("Payload Recebido:", result);

                if (response.ok === true && result.success === true) {
                    // Caminho A: Sucesso
                    console.log("DECISÃO: Sucesso. Abrindo o modal.");
                    modal.classList.remove("hidden");
                } else {
                    // Caminho B: Falha
                    console.log("DECISÃO: Falha. Exibindo alerta de erro.");
                    alert("Senha incorreta ou erro na verificação: " + (result.error || "Tente novamente."));
                }
                console.log("--- FIM DA VERIFICAÇÃO DE SENHA ---");

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

    if (btnAbrirModalSenha && modal) {
        btnAbrirModalSenha.addEventListener("click", () => {
            // NOVO: Vamos verificar se o clique está sendo registrado
            modal.classList.remove("hidden");
        });
    } else {
        // NOVO: Aviso de segurança caso um dos elementos falhe em carregar
        console.error("ERRO: Botão ou Modal não encontrado na página.");
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
