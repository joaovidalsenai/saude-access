document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.inp-busca-hospital');
    const resultsContainer = document.querySelector('#search-results-container');
    const searchForm = document.querySelector('.form-busca-hospital');

    // Impede o formulário de recarregar a página ao ser enviado
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    // Função para buscar e exibir os resultados
    const fetchHospitals = async (searchTerm) => {
        // Limpa resultados se a busca for muito curta
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        try {
            // Chama a nova rota da API que criamos
            const response = await fetch(`/api/hospitais/buscar?termo=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) {
                throw new Error('A resposta da rede não foi bem-sucedida.');
            }
            const hospitais = await response.json();

            // Limpa os resultados antigos
            resultsContainer.innerHTML = '';

            if (hospitais.length === 0) {
                resultsContainer.innerHTML = '<p class="search-no-results">Nenhum hospital encontrado.</p>';
            } else {
                // Cria uma lista de links para os hospitais encontrados
                const ul = document.createElement('ul');
                ul.className = 'search-results-list';
                hospitais.forEach(hospital => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = `/hospital?id=${hospital.hospital_id}`; // Link para a página do hospital
                    a.textContent = hospital.hospital_nome;
                    li.appendChild(a);
                    ul.appendChild(li);
                });
                resultsContainer.appendChild(ul);
            }
        } catch (error) {
            console.error('Erro ao buscar hospitais:', error);
            resultsContainer.innerHTML = '<p class="search-error">Erro ao buscar. Tente novamente.</p>';
        }
    };

    // Event listener que aciona a busca a cada tecla digitada
    searchInput.addEventListener('input', () => {
        fetchHospitals(searchInput.value.trim());
    });

    // Opcional: fecha a lista de resultados se o usuário clicar fora dela
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
            resultsContainer.innerHTML = '';
        }
    });
});