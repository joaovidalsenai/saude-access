document.addEventListener('DOMContentLoaded', () => {
  // 1. CONSTANTES E ELEMENTOS DO DOM
  const form = document.querySelector('form');
  const senhaInput = document.getElementById('cadastro-senha');
  const confirmSenhaInput = document.getElementById('cadastro-confirm-senha');
  const emailInput = document.getElementById('cadastro-email');
  const btnCadastrar = document.getElementById('btn-cadastrar');
  const emailErrorDiv = document.getElementById('email-error');
  const confirmSenhaErrorDiv = document.getElementById('confirm-senha-error');
  const statusMensagemDiv = document.getElementById('status-mensagem');

  if (!senhaInput) return;

  // 2. CRIAÇÃO DINÂMICA DOS CRITÉRIOS DE SENHA
  const criteriaContainer = document.createElement('div');
  criteriaContainer.id = 'password-criteria';
  criteriaContainer.style.fontSize = '14px';
  criteriaContainer.style.marginTop = '8px';

  const criteriaList = document.createElement('ul');
  criteriaList.style.listStyle = 'none';
  criteriaList.style.padding = '0';
  criteriaList.style.margin = '0';

  const criteria = [
    { regex: /.{8,}/, text: 'Mínimo de 8 caracteres' },
    { regex: /[A-Z]/, text: 'Pelo menos 1 letra maiúscula' },
    { regex: /[a-z]/, text: 'Pelo menos 1 letra minúscula' },
    { regex: /\d/, text: 'Pelo menos 1 número' },
    { regex: /[@$!%*?&]/, text: 'Pelo menos 1 caractere especial (!@#$%^&*)' },
  ];

  criteria.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.text;
    li.style.color = '#e74c3c';
    li.style.margin = '4px 0';
    li.classList.add('invalid');
    criteriaList.appendChild(li);
    item.element = li; // guarda referência para atualizar depois
  });

  criteriaContainer.appendChild(criteriaList);
  senhaInput.parentNode.insertBefore(criteriaContainer, senhaInput.nextSibling);

  // 3. FUNÇÕES DE VALIDAÇÃO E INTERFACE
  const showMessage = (element, message, type) => {
    element.textContent = message;
    element.className = `status-mensagem ${type}`;
    element.style.display = 'block';
  };

  const clearMessage = (element) => {
    element.textContent = '';
    element.style.display = 'none';
  };

  const validatePassword = () => {
    const password = senhaInput.value;
    let isValid = true;
    criteria.forEach(item => {
      const match = item.regex.test(password);
      item.element.classList.toggle('valid', match);
      item.element.classList.toggle('invalid', !match);
      item.element.style.color = match ? '#2ecc71' : '#e74c3c';
      if (!match) isValid = false;
    });
    return isValid;
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const updateFormState = () => {
    const email = emailInput.value;
    const senha = senhaInput.value;
    const confirmSenha = confirmSenhaInput.value;

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword();
    const passwordsMatch = senha === confirmSenha && confirmSenha !== '';

    clearMessage(emailErrorDiv);
    clearMessage(confirmSenhaErrorDiv);

    if (email && !isEmailValid) {
      showMessage(emailErrorDiv, 'Por favor, insira um e-mail válido.', 'erro');
    }

    if (confirmSenha && !passwordsMatch) {
      showMessage(confirmSenhaErrorDiv, 'As senhas não coincidem.', 'erro');
    }
    
    // Oculta/exibe a lista de critérios
    criteriaContainer.style.display = senha.length > 0 ? 'block' : 'none';

    btnCadastrar.disabled = !(isEmailValid && isPasswordValid && passwordsMatch);
  };

  // 4. LISTENERS DE EVENTOS
  senhaInput.addEventListener('input', updateFormState);
  confirmSenhaInput.addEventListener('input', updateFormState);
  emailInput.addEventListener('input', updateFormState);

  // Oculta a lista de critérios no início
  criteriaContainer.style.display = 'none';
  btnCadastrar.disabled = true;

  // Lógica de submissão do formulário
  form.addEventListener('submit', async e => {
    e.preventDefault();

    clearMessage(emailErrorDiv);
    clearMessage(confirmSenhaErrorDiv);
    clearMessage(statusMensagemDiv);

    const email = emailInput.value;
    const senha = senhaInput.value;

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword();
    const passwordsMatch = senha === confirmSenhaInput.value;

    if (!isEmailValid) {
      showMessage(emailErrorDiv, 'Por favor, insira um e-mail válido.', 'erro');
      return;
    }
    if (!isPasswordValid) {
      showMessage(statusMensagemDiv, 'A senha não atende a todos os requisitos.', 'erro');
      return;
    }
    if (!passwordsMatch) {
      showMessage(confirmSenhaErrorDiv, 'As senhas não coincidem.', 'erro');
      return;
    }

    try {
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        showMessage(statusMensagemDiv, '🎉 Verifique sua caixa de e-mail para concluir o cadastro!', 'sucesso');
        emailInput.value = '';
        senhaInput.value = '';
        confirmSenhaInput.value = '';
        updateFormState();
        criteriaContainer.style.display = 'none'; // Oculta a lista de critérios após o sucesso
      } else {
        if (result.error && result.error.includes('User already registered')) {
          showMessage(emailErrorDiv, 'Este e-mail já está cadastrado. Por favor, tente fazer login.', 'erro');
        } else {
          showMessage(statusMensagemDiv, 'Erro no cadastro: ' + (result.error || 'Erro desconhecido'), 'erro');
        }
      }
    } catch (err) {
      showMessage(statusMensagemDiv, 'Erro inesperado ao tentar se cadastrar. Por favor, tente novamente.', 'erro');
      console.error('Erro de requisição:', err);
    }
  });
});