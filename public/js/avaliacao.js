document.addEventListener('DOMContentLoaded', () => {
    const avaliacaoForm = document.getElementById('avaliacaoForm');
    const modal = document.getElementById('confirmacaoModal');
    const voltarBtn = document.getElementById('voltarBtn');

    // Função para extrair parâmetros da URL
    const getUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            hospitalId: params.get('id') // Assumindo que o ID do hospital está na URL como ?id=...
        };
    };

    const { hospitalId } = getUrlParams();

    // Se não houver ID do hospital, impede o envio e avisa o usuário
    if (!hospitalId) {
        alert('Erro: ID do hospital não encontrado. Não é possível enviar a avaliação.');
        // Desabilita o botão de envio
        const submitButton = avaliacaoForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.style.opacity = '0.5';
            submitButton.style.cursor = 'not-allowed';
        }
        return; 
    }

    // Adiciona o listener para o formulário
    avaliacaoForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        // Pega os valores dos inputs de estrela selecionados
        const lotacaoValue = document.querySelector('input[name="rating_lotacao"]:checked').value;
        const tempoValue = document.querySelector('input[name="rating_tempo"]:checked').value;
        
        // Monta o corpo da requisição para a API
        const reviewData = {
            hospital_id: parseInt(hospitalId, 10), // Garante que o ID seja um número
            avaliacao_lotacao: parseInt(lotacaoValue, 10),
            avaliacao_tempo_espera: parseInt(tempoValue, 10),
        };

        console.log(reviewData)

        try {
            const response = await fetch('/avaliar/hospital', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao enviar avaliação.');
            }

            // Se a resposta for OK (ex: status 201), mostra o modal de sucesso
            modal.style.display = 'flex';

        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
            alert(`Erro: ${error.message}`);
        }
    });

    // Função para o botão do modal, que redireciona de volta à página do hospital
    voltarBtn.addEventListener('click', () => {
        window.location.href = `/hospital?id=${hospitalId}`;
    });
});