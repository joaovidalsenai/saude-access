/**
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock global do AuthUtils
global.AuthUtils = {
  validarEmail: jest.fn(),
  validarSenha: jest.fn(),
  mostrarMensagem: jest.fn()
};

// Mock do fetch
global.fetch = jest.fn();

describe('Cadastro de Usuário', () => {
  let form, emailInput, senhaInput, confirmSenhaInput, btnCadastrar;
  let emailError, confirmError;

  // Função que simula o código do cadastro
  const initCadastro = () => {
    const form = document.querySelector('form');
    const emailInput = document.getElementById('cadastro-email');
    const senhaInput = document.getElementById('cadastro-senha');
    const confirmSenhaInput = document.getElementById('cadastro-confirm-senha');
    const btnCadastrar = document.getElementById('btn-cadastrar');

    if (!senhaInput || !form) return;

    // Container para critérios de senha
    const criteriaContainer = document.createElement('div');
    criteriaContainer.id = 'password-criteria';
    criteriaContainer.style.cssText = `
      font-size: 14px;
      margin-top: 8px;
      display: none;
    `;

    const criteriaList = document.createElement('ul');
    criteriaList.style.cssText = `
      list-style: none;
      padding: 0;
      margin: 0;
    `;

    senhaInput.parentNode.insertBefore(criteriaContainer, senhaInput.nextSibling);
    criteriaContainer.appendChild(criteriaList);

    // Atualizar critérios visuais
    function atualizarCriteriosSenha() {
      const senha = senhaInput.value;
      const validacao = AuthUtils.validarSenha(senha);

      criteriaList.innerHTML = '';

      validacao.criterios.forEach(criterio => {
        const li = document.createElement('li');
        li.textContent = criterio.texto;
        li.style.cssText = `
          margin: 4px 0;
          color: ${criterio.atende ? '#2ecc71' : '#e74c3c'};
        `;
        criteriaList.appendChild(li);
      });

      criteriaContainer.style.display = senha.length > 0 ? 'block' : 'none';
      return validacao.valida;
    }

    // Validar estado do formulário
    function validarFormulario() {
      const email = emailInput.value.trim();
      const senha = senhaInput.value;
      const confirmSenha = confirmSenhaInput.value;

      const emailValido = AuthUtils.validarEmail(email);
      const senhaValida = atualizarCriteriosSenha();
      const senhasIguais = senha === confirmSenha && confirmSenha !== '';

      const emailError = document.getElementById('email-error');
      const confirmError = document.getElementById('confirm-senha-error');
      if (emailError) emailError.style.display = 'none';
      if (confirmError) confirmError.style.display = 'none';

      if (emailInput.value && !emailValido) {
        if (emailError) {
          emailError.textContent = 'Email inválido';
          emailError.style.display = 'block';
        }
      }
      if (confirmSenhaInput.value && !senhasIguais) {
        if (confirmError) {
          confirmError.textContent = 'As senhas não coincidem';
          confirmError.style.display = 'block';
        }
      }

      const formValido = emailValido && senhaValida && senhasIguais;
      btnCadastrar.disabled = !formValido;
      return formValido;
    }

    emailInput.addEventListener('input', validarFormulario);
    senhaInput.addEventListener('input', validarFormulario);
    confirmSenhaInput.addEventListener('input', validarFormulario);

    btnCadastrar.disabled = true;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validarFormulario()) {
        AuthUtils.mostrarMensagem('Por favor, corrija os erros do formulário', 'erro');
        return;
      }

      const email = emailInput.value.trim().toLowerCase();
      const senha = senhaInput.value;

      const textoOriginal = btnCadastrar.textContent;
      btnCadastrar.disabled = true;
      btnCadastrar.textContent = 'Cadastrando...';

      try {
        const response = await fetch('/auth/cadastrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: senha
          })
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('❌ Erro no cadastro:', result.error);
          AuthUtils.mostrarMensagem(result.error, 'erro');
        } else {
          AuthUtils.mostrarMensagem(
            '🎉 Verifique sua caixa de e-mail para concluir o cadastro!',
            'sucesso'
          );
          form.reset();
        }
      } catch (error) {
        console.error('❌ Erro crítico:', error);
        AuthUtils.mostrarMensagem('Erro inesperado. Tente novamente.', 'erro');
      } finally {
        btnCadastrar.disabled = false;
        btnCadastrar.textContent = textoOriginal;
      }
    });
  };

  beforeEach(() => {
    // Silenciar console.error durante os testes
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Configurar HTML do formulário
    document.body.innerHTML = `
      <form>
        <input type="email" id="cadastro-email" />
        <div id="email-error" style="display: none;"></div>
        
        <input type="password" id="cadastro-senha" />
        
        <input type="password" id="cadastro-confirm-senha" />
        <div id="confirm-senha-error" style="display: none;"></div>
        
        <button id="btn-cadastrar">Cadastrar</button>
      </form>
    `;

    // Obter referências dos elementos
    form = document.querySelector('form');
    emailInput = document.getElementById('cadastro-email');
    senhaInput = document.getElementById('cadastro-senha');
    confirmSenhaInput = document.getElementById('cadastro-confirm-senha');
    btnCadastrar = document.getElementById('btn-cadastrar');
    emailError = document.getElementById('email-error');
    confirmError = document.getElementById('confirm-senha-error');

    // Resetar mocks
    jest.clearAllMocks();
    
    // Configurar retornos padrão dos mocks
    AuthUtils.validarEmail.mockReturnValue(true);
    AuthUtils.validarSenha.mockReturnValue({
      valida: true,
      criterios: [
        { texto: 'Mínimo 8 caracteres', atende: true },
        { texto: 'Letra maiúscula', atende: true },
        { texto: 'Letra minúscula', atende: true },
        { texto: 'Número', atende: true }
      ]
    });

    // Inicializar o código do cadastro
    initCadastro();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Inicialização', () => {
    test('deve criar container de critérios de senha', () => {
      const criteriaContainer = document.getElementById('password-criteria');
      expect(criteriaContainer).toBeTruthy();
      expect(criteriaContainer.style.display).toBe('none');
    });

    test('deve desabilitar botão de cadastro inicialmente', () => {
      expect(btnCadastrar.disabled).toBe(true);
    });
  });

  describe('Validação de Email', () => {
    test('deve validar email válido', () => {
      AuthUtils.validarEmail.mockReturnValue(true);
      emailInput.value = 'usuario@exemplo.com';
      senhaInput.value = 'Senha123';
      confirmSenhaInput.value = 'Senha123';

      emailInput.dispatchEvent(new Event('input'));

      expect(AuthUtils.validarEmail).toHaveBeenCalledWith('usuario@exemplo.com');
      expect(emailError.style.display).toBe('none');
    });

    test('deve mostrar erro para email inválido', () => {
      AuthUtils.validarEmail.mockReturnValue(false);
      emailInput.value = 'email-invalido';
      
      emailInput.dispatchEvent(new Event('input'));

      expect(emailError.style.display).toBe('block');
      expect(emailError.textContent).toBe('Email inválido');
    });

    test('deve desabilitar botão com email inválido', () => {
      AuthUtils.validarEmail.mockReturnValue(false);
      emailInput.value = 'email-invalido';
      senhaInput.value = 'Senha123';
      confirmSenhaInput.value = 'Senha123';

      emailInput.dispatchEvent(new Event('input'));

      expect(btnCadastrar.disabled).toBe(true);
    });
  });

  describe('Validação de Senha', () => {
    test('deve exibir critérios de senha ao digitar', () => {
      AuthUtils.validarSenha.mockReturnValue({
        valida: false,
        criterios: [
          { texto: 'Mínimo 8 caracteres', atende: false },
          { texto: 'Letra maiúscula', atende: false }
        ]
      });

      senhaInput.value = 'abc';
      senhaInput.dispatchEvent(new Event('input'));

      const criteriaContainer = document.getElementById('password-criteria');
      expect(criteriaContainer.style.display).toBe('block');
      
      const criterios = criteriaContainer.querySelectorAll('li');
      expect(criterios.length).toBe(2);
    });

    test('deve ocultar critérios quando senha estiver vazia', () => {
      senhaInput.value = 'Senha123';
      senhaInput.dispatchEvent(new Event('input'));

      senhaInput.value = '';
      senhaInput.dispatchEvent(new Event('input'));

      const criteriaContainer = document.getElementById('password-criteria');
      expect(criteriaContainer.style.display).toBe('none');
    });

    test('deve colorir critérios corretamente', () => {
      AuthUtils.validarSenha.mockReturnValue({
        valida: false,
        criterios: [
          { texto: 'Mínimo 8 caracteres', atende: true },
          { texto: 'Letra maiúscula', atende: false }
        ]
      });

      senhaInput.value = 'senha123';
      senhaInput.dispatchEvent(new Event('input'));

      const criterios = document.querySelectorAll('#password-criteria li');
      expect(criterios[0].style.color).toBe('rgb(46, 204, 113)');
      expect(criterios[1].style.color).toBe('rgb(231, 76, 60)');
    });
  });

  describe('Confirmação de Senha', () => {
    test('deve validar senhas iguais', () => {
      emailInput.value = 'usuario@exemplo.com';
      senhaInput.value = 'Senha123';
      confirmSenhaInput.value = 'Senha123';

      confirmSenhaInput.dispatchEvent(new Event('input'));

      expect(confirmError.style.display).toBe('none');
      expect(btnCadastrar.disabled).toBe(false);
    });

    test('deve mostrar erro quando senhas não coincidem', () => {
      emailInput.value = 'usuario@exemplo.com';
      senhaInput.value = 'Senha123';
      confirmSenhaInput.value = 'Senha456';

      confirmSenhaInput.dispatchEvent(new Event('input'));

      expect(confirmError.style.display).toBe('block');
      expect(confirmError.textContent).toBe('As senhas não coincidem');
      expect(btnCadastrar.disabled).toBe(true);
    });
  });

  describe('Validação do Formulário Completo', () => {
    test('deve habilitar botão quando todos os campos forem válidos', () => {
      emailInput.value = 'usuario@exemplo.com';
      senhaInput.value = 'Senha123';
      confirmSenhaInput.value = 'Senha123';

      emailInput.dispatchEvent(new Event('input'));

      expect(btnCadastrar.disabled).toBe(false);
    });

    test('deve manter botão desabilitado se qualquer campo for inválido', () => {
      AuthUtils.validarSenha.mockReturnValue({ valida: false, criterios: [] });
      
      emailInput.value = 'usuario@exemplo.com';
      senhaInput.value = 'abc';
      confirmSenhaInput.value = 'abc';

      senhaInput.dispatchEvent(new Event('input'));

      expect(btnCadastrar.disabled).toBe(true);
    });
  });

  describe('Submissão do Formulário', () => {
    beforeEach(() => {
      emailInput.value = 'usuario@exemplo.com';
      senhaInput.value = 'Senha123';
      confirmSenhaInput.value = 'Senha123';
    });

    test('deve impedir submissão se formulário for inválido', async () => {
      AuthUtils.validarEmail.mockReturnValue(false);
      
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(AuthUtils.mostrarMensagem).toHaveBeenCalledWith(
        'Por favor, corrija os erros do formulário',
        'erro'
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    test('deve enviar requisição POST para /auth/cadastrar', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fetch).toHaveBeenCalledWith('/auth/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'usuario@exemplo.com',
          password: 'Senha123'
        })
      });
    });

    test('deve converter email para minúsculas', async () => {
      emailInput.value = 'USUARIO@EXEMPLO.COM';
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 0));

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.email).toBe('usuario@exemplo.com');
    });

    test('deve desabilitar botão durante submissão', async () => {
      fetch.mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        }), 100);
      }));

      form.dispatchEvent(new Event('submit'));
      
      expect(btnCadastrar.disabled).toBe(true);
      expect(btnCadastrar.textContent).toBe('Cadastrando...');
    });

    test('deve mostrar mensagem de sucesso após cadastro', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(AuthUtils.mostrarMensagem).toHaveBeenCalledWith(
        '🎉 Verifique sua caixa de e-mail para concluir o cadastro!',
        'sucesso'
      );
    });

    test('deve resetar formulário após sucesso', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const resetSpy = jest.spyOn(form, 'reset');
      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(resetSpy).toHaveBeenCalled();
    });

    test('deve mostrar mensagem de erro em caso de falha', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email já cadastrado' })
      });

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(AuthUtils.mostrarMensagem).toHaveBeenCalledWith(
        'Email já cadastrado',
        'erro'
      );
    });

    test('deve reabilitar botão após erro', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Erro' })
      });

      const textoOriginal = btnCadastrar.textContent;
      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(btnCadastrar.disabled).toBe(false);
      expect(btnCadastrar.textContent).toBe(textoOriginal);
    });

    test('deve tratar erro de rede', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(AuthUtils.mostrarMensagem).toHaveBeenCalledWith(
        'Erro inesperado. Tente novamente.',
        'erro'
      );
    });
  });

  describe('Validação em Tempo Real', () => {
    test('deve validar enquanto usuário digita no email', () => {
      emailInput.value = 'u';
      emailInput.dispatchEvent(new Event('input'));
      expect(AuthUtils.validarEmail).toHaveBeenCalled();

      emailInput.value = 'us';
      emailInput.dispatchEvent(new Event('input'));
      expect(AuthUtils.validarEmail).toHaveBeenCalledTimes(2);
    });

    test('deve validar enquanto usuário digita senha', () => {
      senhaInput.value = 'S';
      senhaInput.dispatchEvent(new Event('input'));
      expect(AuthUtils.validarSenha).toHaveBeenCalled();

      senhaInput.value = 'Se';
      senhaInput.dispatchEvent(new Event('input'));
      expect(AuthUtils.validarSenha).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    test('deve remover espaços em branco do email', async () => {
      emailInput.value = '  usuario@exemplo.com  ';
      senhaInput.value = 'Senha123';
      confirmSenhaInput.value = 'Senha123';
      
      // Disparar input para validar formulário
      emailInput.dispatchEvent(new Event('input'));
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      form.dispatchEvent(new Event('submit'));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fetch).toHaveBeenCalled();
      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      expect(requestBody.email).toBe('usuario@exemplo.com');
    });
  });
});