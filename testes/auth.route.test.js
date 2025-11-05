// testes/auth.route.test.js
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// Mock do Supabase
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    setSession: jest.fn()
  }
};

// Mock do middleware protect
const mockProtect = {
  partially: (req, res, next) => next(),
  entirely: (req, res, next) => next()
};

// Configura os mocks antes de importar os módulos
jest.unstable_mockModule('../src/db/supabase.js', () => ({
  default: mockSupabase
}));

jest.unstable_mockModule('../src/middlewares/protect.route.js', () => ({
  default: mockProtect
}));

// Agora importa os módulos mockados
const { default: auth } = await import('../src/routes/auth.routes.js');

// Configuração da aplicação de teste
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(auth);

describe('Auth Routes - Testes de Integração', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== TESTES DE CADASTRO ==========
  describe('POST /auth/cadastrar', () => {
    
    test('deve cadastrar usuário com dados válidos', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ 
        data: { user: { id: '123', email: 'teste@email.com' } },
        error: null 
      });

      const response = await request(app)
        .post('/auth/cadastrar')
        .send({ email: 'teste@email.com', password: 'senha12345' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Cadastro realizado! Verifique seu e-mail.');
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'teste@email.com',
        password: 'senha12345',
        options: { data: { full_user_access: false } }
      });
    });

    test('deve rejeitar cadastro sem email', async () => {
      const response = await request(app)
        .post('/auth/cadastrar')
        .send({ password: 'senha12345' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Dados de cadastro inválidos.');
    });

    test('deve rejeitar senha com menos de 8 caracteres', async () => {
      const response = await request(app)
        .post('/auth/cadastrar')
        .send({ email: 'teste@email.com', password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Dados de cadastro inválidos.');
    });

    test('deve retornar erro se usuário já existe', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ 
        data: null,
        error: { message: 'User already registered' }
      });

      const response = await request(app)
        .post('/auth/cadastrar')
        .send({ email: 'existente@email.com', password: 'senha12345' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Este e-mail já está cadastrado.');
    });
  });

  // ========== TESTES DE LOGIN ==========
  describe('POST /auth/entrar', () => {
    
    test('deve fazer login com credenciais válidas', async () => {
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const response = await request(app)
        .post('/auth/entrar')
        .send({ email: 'teste@email.com', password: 'senha12345' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login bem-sucedido!');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('deve rejeitar login sem email', async () => {
      const response = await request(app)
        .post('/auth/entrar')
        .send({ password: 'senha12345' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email e senha são obrigatórios.');
    });

    test('deve rejeitar credenciais inválidas', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      const response = await request(app)
        .post('/auth/entrar')
        .send({ email: 'teste@email.com', password: 'senhaErrada' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Email ou senha incorretos.');
    });
  });

  // ========== TESTES DE LOGOUT ==========
  describe('POST /auth/sair', () => {
    
    test('deve fazer logout e limpar cookies', async () => {
      const response = await request(app).post('/auth/sair');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout realizado com sucesso.');
    });
  });

  // ========== TESTES DE VERIFICAÇÃO DE AUTH ==========
  describe('GET /auth', () => {
    
    test('deve retornar usuário autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'teste@email.com' } },
        error: null
      });

      const response = await request(app)
        .get('/auth')
        .set('Cookie', ['sb-access-token=mock-token']);

      expect(response.status).toBe(200);
      expect(response.body.user).toBe(true);
    });

    test('deve rejeitar requisição sem token', async () => {
      const response = await request(app).get('/auth');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de acesso não fornecido.');
    });
  });

  // ========== TESTES DE RECUPERAÇÃO DE SENHA ==========
  describe('POST /auth/recuperar-senha', () => {
    
    test('deve enviar email de recuperação', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/auth/recuperar-senha')
        .send({ email: 'teste@email.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('link de recuperação foi enviado');
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalled();
    });

    test('deve rejeitar requisição sem email', async () => {
      const response = await request(app)
        .post('/auth/recuperar-senha')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('O e-mail é obrigatório.');
    });
  });

  // ========== TESTES DE ALTERAÇÃO DE SENHA ==========
  describe('POST /auth/alterar/senha', () => {
    
    test('deve alterar senha com sucesso', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ 
        data: { user: { id: '123' } },
        error: null 
      });

      const response = await request(app)
        .post('/auth/alterar/senha')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send({ password: 'novaSenha123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Senha alterada com sucesso!');
    });

    test('deve rejeitar senha menor que 8 caracteres', async () => {
      const response = await request(app)
        .post('/auth/alterar/senha')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send({ password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('pelo menos 8 caracteres');
    });
  });

  // ========== TESTES DE ALTERAÇÃO DE EMAIL ==========
  describe('POST /auth/alterar/email', () => {
    
    test('deve solicitar alteração de email', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/auth/alterar/email')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send({ newEmail: 'novoemail@email.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Verifique seu novo e-mail');
    });

    test('deve rejeitar email inválido', async () => {
      const response = await request(app)
        .post('/auth/alterar/email')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send({ newEmail: 'email-invalido' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Formato de e-mail inválido.');
    });

    test('deve rejeitar email já em uso', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({ 
        error: { message: 'Email address already in use' }
      });

      const response = await request(app)
        .post('/auth/alterar/email')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send({ newEmail: 'usado@email.com' });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('já está sendo usado');
    });
  });
});