// testes/auth.route.test.js

// PASSO 1: Mockar o módulo do Supabase COMPLETAMENTE no topo do arquivo.
// O caminho CORRETO é '../db/supabase.js'
jest.mock('../db/supabase.js', () => ({
  // Exporta o objeto 'supabase' mockado
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      setSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  },
}));

// PASSO 2: Importar as dependências e o servidor (app.js)
import request from 'supertest';
import app from '../app.js'; 

// PASSO 3: Importar o objeto MOCKADO para configurá-lo
import { supabase } from '../db/supabase.js';

// --- Mocks e Setup Comuns ---

const mockUser = {
  id: 'test-uuid-123',
  email: 'test@example.com',
};

// Resposta de sucesso de sessão do Supabase (para login)
const mockSessionSuccess = {
  data: { 
    session: { 
        access_token: 'valid-access-token', 
        refresh_token: 'valid-refresh-token' 
    },
    user: mockUser
  },
  error: null,
};

const mockSignUpSuccess = {
    data: { user: mockUser },
    error: null,
};

beforeEach(() => {
    // Limpar os mocks antes de cada teste
    jest.clearAllMocks();
});

// --- Início da Suíte de Testes ---

describe('Auth Routes - /auth', () => {

    test('POST /auth/login - Deve autenticar o usuário e definir cookies', async () => {
        // Configurar o mock para retornar sucesso
        supabase.auth.signInWithPassword.mockResolvedValue(mockSessionSuccess);

        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe('/');
        
        // Verifica se os cookies foram definidos
        expect(response.header['set-cookie'][0]).toContain('sb-access-token=valid-access-token');
    });

    test('POST /auth/login - Deve falhar com credenciais inválidas', async () => {
        // Configurar o mock para retornar falha de autenticação
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { session: null, user: null },
            error: { message: 'Invalid login credentials' },
        });

        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'bad@user.com', password: 'wrongpassword' });

        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe('/login'); 
    });
    
    test('POST /auth/signup - Deve registrar o usuário com sucesso', async () => {
        // Configurar o mock para retornar sucesso no cadastro
        supabase.auth.signUp.mockResolvedValue(mockSignUpSuccess);
        
        const response = await request(app)
            .post('/auth/signup')
            .send({ email: 'new@user.com', password: 'newpassword123' });

        expect(supabase.auth.signUp).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe('/cadastro-perfil'); 
    });
    
    test('POST /auth/logout - Deve fazer logout e limpar cookies', async () => {
        // Configurar o mock para retornar sucesso no logout
        supabase.auth.signOut.mockResolvedValue({ error: null });

        const response = await request(app)
            .post('/auth/logout')
            .set('Cookie', ['sb-access-token=old-token']); // Simula cookies existentes

        expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe('/login');
        
        // Verifica que o cookie foi limpo (o Supertest geralmente envia um cookie expirado/vazio)
        const setCookieHeaders = response.header['set-cookie'];
        expect(setCookieHeaders.join(';')).toContain('sb-access-token=;'); 
    });

});