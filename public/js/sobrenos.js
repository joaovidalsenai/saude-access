// Inicialização do EmailJS
// A chave pública 'ogzroqAs66IL1N7Ya' e os IDs de serviço/template 'service_t0swn8a' e 'template_xywrtvl'
// foram mantidos conforme o código fornecido, assumindo que estão corretos.
emailjs.init('ogzroqAs66IL1N7Ya');

// =================================================================
// 1. Funções do Acordeão (Justificativa do Projeto)
// =================================================================

function toggleAccordion(header) {
    const item = header.parentElement;
    const content = header.nextElementSibling;
    const isActive = header.classList.contains('active');

    // 1. Fecha todos os outros acordeões
    document.querySelectorAll('.accordion-item').forEach(accordionItem => {
        const h = accordionItem.querySelector('.accordion-header');
        const c = accordionItem.querySelector('.accordion-content');
        
        if (h !== header && h.classList.contains('active')) {
            h.classList.remove('active');
            c.classList.remove('active');
            c.style.maxHeight = '0';
            h.querySelector('.accordion-toggle').textContent = '▼';
        }
    });

    // 2. Alterna o acordeão clicado
    if (!isActive) {
        // Abre
        header.classList.add('active');
        content.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";
        header.querySelector('.accordion-toggle').textContent = '▲'; // Mudança para indicar aberto
    } else {
        // Fecha
        header.classList.remove('active');
        content.classList.remove('active');
        content.style.maxHeight = '0';
        header.querySelector('.accordion-toggle').textContent = '▼';
    }
}

// Inicializa a altura para 0 após o DOM carregar para garantir a animação
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.accordion-content').forEach(content => {
        content.style.maxHeight = '0';
    });
});


// =================================================================
// 2. Funções do Modal (Popup de Feedback)
// =================================================================

// Função de fechamento do modal definida no escopo global para funcionar com onclick="" no HTML
function closeModal() {
    const modal = document.getElementById('feedbackModal');
    modal.classList.remove('active');
}

// Função para exibir o modal
function showModal(type, title, message) {
    const modal = document.getElementById('feedbackModal');
    const icon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    // Configura o ícone e estilo baseado no tipo
    if (type === 'success') {
        icon.textContent = '✓';
        icon.classList.remove('error');
    } else {
        icon.textContent = '✕'; // Usando '✕' em vez de '✖' que é mais legível em algumas fontes
        icon.classList.add('error');
    }
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('active');
}

// Fecha modal ao clicar fora (corrigido para não depender da variável window.onclick)
document.addEventListener('click', function(event) {
    const modal = document.getElementById('feedbackModal');
    // Verifica se o modal está ativo e se o clique foi fora do modal-content
    if (modal.classList.contains('active') && event.target === modal) {
        closeModal();
    }
});


// =================================================================
// 3. Formulário de Contato (EmailJS)
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('name');
            const sobrenome = document.getElementById('surname');
            const email = document.getElementById('email');
            const assunto = document.getElementById('subject');
            const mensagem = document.getElementById('message');
            
            if (!nome || !sobrenome || !email || !assunto || !mensagem) {
                showModal('error', 'Erro!', 'Um ou mais campos não foram encontrados. Por favor, recarregue a página.');
                return;
            }
            
            const dados = {
                // Combina nome e sobrenome como from_name para o template EmailJS, se necessário
                from_name: `${nome.value} ${sobrenome.value}`, 
                name: nome.value, // Mantém separado se o template precisar
                surname: sobrenome.value,
                email: email.value,
                subject: assunto.value,
                message: mensagem.value,
                date: new Date().toLocaleString('pt-BR')
            };
            
            const btn = e.target.querySelector('.submit-button');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Enviando...';
            
            // service_t0swn8a e template_xywrtvl são os IDs assumidos do EmailJS
            emailjs.send('service_t0swn8a', 'template_xywrtvl', dados)
                .then(function(response) {
                    console.log('✅ SUCESSO:', response);
                    showModal('success', 'Mensagem Enviada!', 'Recebemos sua mensagem e entraremos em contato em breve. Obrigado!');
                    form.reset();
                })
                .catch(function(error) {
                    console.error('❌ ERRO:', error);
                    showModal('error', 'Ops! Algo deu errado', 'Não foi possível enviar sua mensagem. Por favor, tente novamente mais tarde.');
                })
                .finally(function() {
                    btn.disabled = false;
                    btn.textContent = originalText; // Usa texto original, que é 'Enviar Mensagem'
                }); 
        });
    }
});