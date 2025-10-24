// Inicialização
emailjs.init('ogzroqAs66IL1N7Ya');

// Accordion
function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const isActive = header.classList.contains('active');
   
    document.querySelectorAll('.accordion-header').forEach(h => {
        h.classList.remove('active');
        h.nextElementSibling.classList.remove('active');
    });
   
    if (!isActive) {
        header.classList.add('active');
        content.classList.add('active');
    }
}

// Formulário
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Captura os valores COM log detalhado
            const nome = document.getElementById('name');
            const sobrenome = document.getElementById('surname');
            const email = document.getElementById('email');
            const assunto = document.getElementById('subject');
            const mensagem = document.getElementById('message');
            
            console.log('=== ELEMENTOS ENCONTRADOS ===');
            console.log('Campo nome existe?', nome !== null);
            console.log('Campo sobrenome existe?', sobrenome !== null);
            console.log('Campo email existe?', email !== null);
            console.log('Campo assunto existe?', assunto !== null);
            console.log('Campo mensagem existe?', mensagem !== null);
            
            if (!nome || !sobrenome || !email || !assunto || !mensagem) {
                alert('❌ ERRO: Um ou mais campos não foram encontrados no HTML!');
                return;
            }
            
            const dados = {
                name: nome.value,
                surname: sobrenome.value,
                email: email.value,
                subject: assunto.value,
                message: mensagem.value,
                date: new Date().toLocaleString('pt-BR')
            };
            
            console.log('=== VALORES CAPTURADOS ===');
            console.log(dados);
            
            // Envia
            const btn = e.target.querySelector('.submit-button');
            btn.disabled = true;
            btn.textContent = 'Enviando...';
            
            emailjs.send('service_t0swn8a', 'template_xywrtvl', dados)
                .then(function(response) {
                    console.log('✅ SUCESSO:', response);
                    alert('✅ Mensagem enviada!');
                    form.reset();
                })
                .catch(function(error) {
                    console.error('❌ ERRO:', error);
                    alert('❌ Erro: ' + (error.text || error.message));
                })
                .finally(function() {
                    btn.disabled = false;
                    btn.textContent = 'Enviar Mensagem';
                });
        });
    } else {
        console.error('❌ FORMULÁRIO NÃO ENCONTRADO!');
    }
});