// public/js/scriptLogin.js

// Apenas regex para validar e-mail
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Elementos do DOM (ajuste os seletores caso seus ids/names sejam diferentes)
const DOM = {
  form: document.getElementById('formLogin'),          // seu <form id="formLogin">
  email: document.getElementById('login-email'),       // <input id="login-email" name="cliente_email">
  senha: document.getElementById('login-senha'),       // <input id="login-senha"  name="cliente_senha">
  lembrar: document.getElementById('lembrar-login'),   // <input type="checkbox" id="lembrar-login">
  botao: document.querySelector('.btn-entrar')         // <button class="btn-entrar">
}

// Exibe ou limpa mensagem de erro de um campo
function exibirErro(input, mensagem) {
  const wrapper = input.parentNode
  const erroExistente = wrapper.querySelector('.erro-mensagem')
  if (erroExistente) erroExistente.remove()

  if (!mensagem) {
    input.classList.remove('input-erro')
    return
  }

  input.classList.add('input-erro')
  const span = document.createElement('span')
  span.className = 'erro-mensagem'
  span.textContent = mensagem
  wrapper.appendChild(span)
}

// Exibe mensagem de erro geral no topo do formulário
function exibirErroLogin(mensagem) {
  const existente = DOM.form.querySelector('.erro-login-geral')
  if (existente) existente.remove()

  if (!mensagem) return

  const div = document.createElement('div')
  div.className = 'erro-login-geral'
  div.textContent = mensagem
  div.style.cssText = `
    color: #e74c3c;
    background: #fdf2f2;
    border: 1px solid #e74c3c;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 15px;
    text-align: center;
    font-size: 14px;
  `
  DOM.form.insertBefore(div, DOM.form.firstChild)
}

// Valida e-mail
function validarEmail() {
  const v = DOM.email.value.trim()
  if (!v)   return 'E-mail é obrigatório.'
  if (!REGEX_EMAIL.test(v))
    return 'Formato de e-mail inválido.'
  return ''
}

// Valida senha
function validarSenha() {
  const v = DOM.senha.value
  if (!v)        return 'Senha é obrigatória.'
  if (v.length < 3) return 'Senha muito curta.'
  return ''
}

// Valida cada campo e exibe erro
function validarCampo(input, fnValidacao) {
  const msg = fnValidacao()
  exibirErro(input, msg)
  return !msg
}

// Indicador de loading no botão
function mostrarCarregamento(mostrar = true) {
  if (mostrar) {
    DOM.botao.disabled = true
    DOM.botao.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;color:#fff">
        <div style="width:16px;height:16px;border:2px solid #fff40;border-top:2px solid #fff;border-radius:50%;animation:spin 1s linear infinite;"></div>
        Entrando...
      </span>`
    if (!document.getElementById('spin-style')) {
      const style = document.createElement('style')
      style.id = 'spin-style'
      style.textContent = `
        @keyframes spin {100%{transform:rotate(360deg)}}`
      document.head.appendChild(style)
    }
  } else {
    DOM.botao.disabled = false
    DOM.botao.textContent = 'Entrar'
  }
}

// Simulação de autenticação (substitua por fetch à sua API)
async function autenticarUsuario(email, senha) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, senha })
  });

  // Checa status HTTP
  if (!response.ok) {
    // por exemplo 400 ou 401
    const err = await response.json();
    return { sucesso: false, erro: err.mensagem || 'Erro desconhecido.' };
  }

  // Se deu certo, espera um JSON como { sucesso: true, token: '...', usuario: {...} }
  const data = await response.json();
  return data;
}

// Guarda e-mail se “lembrar-login” estiver checado
function salvarDadosLogin(email) {
  if (DOM.lembrar.checked) {
    try {
      localStorage.setItem('meuAppLogin', JSON.stringify({ email, data: Date.now() }))
    } catch {}
  }
}

// Carrega e-mail salvo
function carregarDadosLogin() {
  try {
    const saved = JSON.parse(localStorage.getItem('meuAppLogin'))
    if (saved?.email) {
      DOM.email.value = saved.email
      DOM.lembrar.checked = true
    }
  } catch {}
}

// Trata submissão do formulário
DOM.form.addEventListener('submit', async e => {
  e.preventDefault()
  exibirErroLogin('')

  const okEmail = validarCampo(DOM.email, validarEmail)
  const okSenha = validarCampo(DOM.senha, validarSenha)
  if (!okEmail || !okSenha) return

  const email = DOM.email.value.trim()
  const senha = DOM.senha.value

  try {
    mostrarCarregamento(true)
    const resultado = await autenticarUsuario(email, senha)

    if (resultado.sucesso) {
      salvarDadosLogin(email)
      exibirErroLogin('')
      const msg = document.createElement('div')
      msg.className = 'sucesso-login'
      msg.textContent = 'Login realizado com sucesso! Redirecionando...'
      msg.style.cssText = `
        color: #27ae60;
        background: #f0f9f4;
        border: 1px solid #27ae60;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
        text-align: center;
        font-size: 14px;`
      DOM.form.insertBefore(msg, DOM.form.firstChild)
      setTimeout(() => window.location.href = '/inicio', 1500)
    } else {
      exibirErroLogin(resultado.erro)
    }
  } catch (err) {
    console.error(err)
    exibirErroLogin('Erro de conexão. Tente novamente.')
  } finally {
    mostrarCarregamento(false)
  }
})

// Permitir submit com Enter na senha
DOM.senha.addEventListener('keypress', e => {
  if (e.key === 'Enter') DOM.form.dispatchEvent(new Event('submit'))
})

// Limpa erros ao digitar
[DOM.email, DOM.senha].forEach(input =>
  input.addEventListener('input', () => {
    exibirErro(input, '')
    exibirErroLogin('')
  })
)

// Carrega e-mail salvo ao iniciar
document.addEventListener('DOMContentLoaded', carregarDadosLogin)