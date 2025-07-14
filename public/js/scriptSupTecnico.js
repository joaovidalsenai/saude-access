function enviarMensagem(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const assunto = document.getElementById('assunto').value;
    const mensagem = document.getElementById('mensagem').value;
    
    // Simular envio
    alert('Mensagem enviada com sucesso! Retornaremos em breve.');
    
    // Limpar formulário
    document.querySelector('.contact-form').reset();
}

// Função para mostrar/esconder respostas FAQ
function toggleFaq(questionElement) {
    const faqItem = questionElement.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    
    // Toggle das classes
    faqItem.classList.toggle('open');
    answer.classList.toggle('open');
}

// Adicionar efeito de clique nos itens de contato
document.querySelectorAll('.contact-item').forEach(item => {
    item.addEventListener('click', function(e) {
        if (!this.onclick) {
            const email = this.textContent.includes('suporte@hospitalfinder.com.br');
            const telefone = this.textContent.includes('0800 123 4567');
            
            if (email) {
                window.location.href = 'mailto:suporte@hospitalfinder.com.br';
            } else if (telefone) {
                window.location.href = 'tel:08001234567';
            }
        }
    });
});