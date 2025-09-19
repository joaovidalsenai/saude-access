document.addEventListener('DOMContentLoaded', () => {
    const avaliacaoForm = document.getElementById('avaliacaoForm');
    const modal = document.getElementById('confirmacaoModal');
    const voltarBtn = document.getElementById('voltarBtn');

    const getUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            hospitalId: params.get('id')
        };
    };

    const { hospitalId } = getUrlParams();
    const submitButton = avaliacaoForm.querySelector('button[type="submit"]');

    if (!hospitalId) {
        alert('Erro: ID do hospital não encontrado. Não é possível enviar a avaliação.');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.style.opacity = '0.5';
            submitButton.style.cursor = 'not-allowed';
        }
        return;
    }

    avaliacaoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let tarefasFetch = [];

        // --- 1. VERIFICAR E MONTAR DADOS DA AVALIAÇÃO GERAL ---
        const lotacaoInput = document.querySelector('input[name="rating_lotacao"]:checked');
        const tempoInput = document.querySelector('input[name="rating_tempo"]:checked');
        const atendimentoInput = document.querySelector('input[name="rating_atendimento"]:checked');
        const infraestruturaInput = document.querySelector('input[name="rating_infraestrutura"]:checked');

        // A avaliação geral é válida se TODAS as quatro avaliações de estrelas foram preenchidas
        if (lotacaoInput && tempoInput && atendimentoInput && infraestruturaInput) {
            const reviewData = {
                hospital_id: parseInt(hospitalId, 10),
                avaliacao_lotacao: parseInt(lotacaoInput.value, 10),
                avaliacao_tempo_espera: parseInt(tempoInput.value, 10),
                avaliacao_atendimento: parseInt(atendimentoInput.value, 10),
                avaliacao_infraestrutura: parseInt(infraestruturaInput.value, 10),
            };

            tarefasFetch.push(
                fetch('/avaliar/hospital', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reviewData)
                })
            );
        }

        // --- 2. VERIFICAR E MONTAR DADOS DO REPORTE DE ESPECIALIDADE ---
        const especialidadeIdInput = document.getElementById('especialidade_id');
        const especialidadeStatusInput = document.querySelector('input[name="especialidade_status"]:checked');
        
        // O reporte é válido se um ID de especialidade (não vazio) E um status foram selecionados
        if (especialidadeIdInput.value && especialidadeStatusInput) {
            const tempoEsperaInput = document.getElementById('tempo_espera_estimado');
            const reportData = {
                hospital_id: parseInt(hospitalId, 10),
                especialidade_id: parseInt(especialidadeIdInput.value, 10),
                especialidade_status: especialidadeStatusInput.value,
                tempo_espera_estimado: tempoEsperaInput.value ? parseInt(tempoEsperaInput.value, 10) : null
            };

            tarefasFetch.push(
                fetch('/avaliar/especialidade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reportData)
                })
            );
        }

        // --- 3. EXECUTAR AS TAREFAS DE FETCH ---
        if (tarefasFetch.length === 0) {
            alert('Por favor, preencha pelo menos a avaliação geral completa (todas as 4 seções) ou reporte o status de uma especialidade.');
            return;
        }

        try {
            const responses = await Promise.all(tarefasFetch);

            for (const response of responses) {
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Falha em uma das requisições (Status: ${response.status}).`);
                }
            }
            
            modal.style.display = 'flex';

        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            alert(`Erro: ${error.message}`);
        }
    });

    voltarBtn.addEventListener('click', () => {
        window.location.href = `/hospital?id=${hospitalId}`;
    });
});