
// ========== INICIALIZAÇÃO DO EMAILJS ==========
(function() {
    emailjs.init('ogzroqAs66IL1N7Ya'); // ⚠️ TROQUE pela Public Key verdadeira (não é o Service ID!)
})();

// ========== FUNÇÃO DO ACCORDION (mantida como estava) ==========
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

// ========== FUNCIONALIDADE DO FORMULÁRIO DE CONTATO ==========
const contactForm = document.querySelector('.contact-form');
const submitButton = document.querySelector('.submit-button');

if (contactForm && submitButton) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
       
        // Desabilita o botão e mostra loading
        submitButton.disabled = true;
        const textoOriginal = submitButton.textContent;
        submitButton.textContent = 'Enviando...';
        submitButton.style.cursor = 'wait';
       
        // Prepara os dados do formulário
        const templateParams = {
            from_name: document.getElementById('name').value,
            from_surname: document.getElementById('surname').value,
            from_email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
       
        // Log para debug (remova depois)
        console.log('Enviando dados:', templateParams);
       
        // Envia o email usando EmailJS
        emailjs.send('service_t0swn8a', 'template_xywrtvl', templateParams)
            .then(function(response) {
                console.log('✓ Sucesso!', response.status, response.text);
                alert('✓ Mensagem enviada com sucesso! Entraremos em contato em breve.');
                contactForm.reset();
                submitButton.disabled = false;
                submitButton.textContent = textoOriginal;
                submitButton.style.cursor = 'pointer';
            }, function(error) {
                console.error('✗ Erro completo:', error);
                alert('✗ Erro ao enviar mensagem. Por favor, tente novamente.');
                submitButton.disabled = false;
                submitButton.textContent = textoOriginal;
                submitButton.style.cursor = 'pointer';
            });
    });
}