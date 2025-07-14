        // Manipular envio do formulário
        document.getElementById('recuperarForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const credencial = document.getElementById('credencial-recuperar').value.trim();
            
            if (!credencial) {
                alert('Por favor, digite seu CPF ou e-mail.');
                return;
            }

            // Simular envio
            const btnEnviar = document.querySelector('.btn-enviar');
            const textoOriginal = btnEnviar.innerHTML;
            
            btnEnviar.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" style="margin-right: 0.5rem; animation: spin 1s linear infinite;">
                    <path d="M232,128a104,104,0,0,1-208,0c0-41,23.81-78.36,60.66-95.27a8,8,0,0,1,6.68,14.54C60.15,61.59,40,93.27,40,128a88,88,0,0,0,176,0c0-34.73-20.15-66.41-51.34-80.73a8,8,0,0,1,6.68-14.54C208.19,49.64,232,87,232,128Z"></path>
                </svg>
                Enviando...
            `;
            btnEnviar.disabled = true;

            // Simular delay de envio
            setTimeout(() => {
                btnEnviar.innerHTML = textoOriginal;
                btnEnviar.disabled = false;
                
                // Mostrar mensagem de sucesso
                document.getElementById('sucessoMsg').classList.add('ativo');
                
                // Limpar formulário
                document.getElementById('credencial-recuperar').value = '';
                
                // Auto-redirecionar após alguns segundos (opcional)
                setTimeout(() => {
                    // window.location.href = 'login.html';
                }, 5000);
                
            }, 2000);
        });

        // Validação em tempo real
        document.getElementById('credencial-recuperar').addEventListener('input', function(e) {
            const value = e.target.value.trim();
            const isEmail = value.includes('@');
            const isCPF = /^\d{11}$/.test(value.replace(/\D/g, ''));
            
            if (value.length > 0 && !isEmail && !isCPF && value.replace(/\D/g, '').length !== 11) {
                e.target.setCustomValidity('Digite um CPF válido (11 dígitos) ou um e-mail válido');
            } else {
                e.target.setCustomValidity('');
            }
        });

        // Adicionar animação de spin no CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);