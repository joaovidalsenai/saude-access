// public/js/historico.js

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os elementos necessários
    const modal = document.getElementById('modalDetalhes');
    const closeModalBtn = document.getElementById('modalCloseBtn');
    const reviewItems = document.querySelectorAll('.item-avaliacao');

    // Elementos do modal que serão preenchidos
    const modalHospitalNome = document.getElementById('modalHospitalNome');
    const estrelasLotacao = document.getElementById('estrelasLotacao');
    const estrelasTempo = document.getElementById('estrelasTempo');
    const estrelasAtendimento = document.getElementById('estrelasAtendimento');
    const estrelasInfraestrutura = document.getElementById('estrelasInfraestrutura');
    const linkHospital = document.getElementById('linkHospital');

    // Função para criar as 5 divs de estrelas e aplicar a classe de rating
    const renderStars = (container, rating) => {
        container.innerHTML = ''; // Limpa estrelas anteriores
        container.className = 'estrelas-display'; // Reseta a classe
        if (rating > 0) {
            container.classList.add(`rating-${rating}`);
        }
        for (let i = 0; i < 5; i++) {
            const starDiv = document.createElement('div');
            starDiv.className = 'estrela-svg';
            container.appendChild(starDiv);
        }
    };

    // Adiciona um evento de clique para cada item da lista de avaliações
    reviewItems.forEach(item => {
        item.addEventListener('click', () => {
            const data = item.dataset;

            // 1. Preenche o modal com os dados do item clicado
            modalHospitalNome.textContent = data.hospitalNome;
            linkHospital.href = `/hospital?id=${data.hospitalId}`;

            // 2. Renderiza as estrelas para cada critério
            renderStars(estrelasLotacao, data.lotacao);
            renderStars(estrelasTempo, data.tempo);
            renderStars(estrelasAtendimento, data.atendimento);
            renderStars(estrelasInfraestrutura, data.infraestrutura);

            // 3. Exibe o modal
            modal.style.display = 'flex';
        });
    });

    // Função para fechar o modal
    const closeModal = () => {
        modal.style.display = 'none';
    };

    // Eventos para fechar o modal
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        // Fecha o modal apenas se o clique for no fundo escuro (o overlay)
        if (event.target === modal) {
            closeModal();
        }
    });
});