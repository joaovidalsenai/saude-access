function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const isActive = header.classList.contains('active');
    
    // Fecha todos os itens
    document.querySelectorAll('.accordion-header').forEach(h => {
        h.classList.remove('active');
        h.nextElementSibling.classList.remove('active');
    });
    
    // Abre o item clicado se não estava ativo
    if (!isActive) {
        header.classList.add('active');
        content.classList.add('active');
    }
}