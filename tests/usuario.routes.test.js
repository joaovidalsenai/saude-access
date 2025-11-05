// testes/usuario.routes.test.js
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// Mock do Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    updateUser: jest.fn()
  },
  from: jest.fn()
};

// Mock do middleware protect
const mockProtect = {
  partially: (req, res, next) => next(),
  entirely: (req, res, next) => next()
};

// Configura os mocks
jest.unstable_mockModule('../src/db/supabase.js', () => ({
  default: mockSupabase
}));

jest.unstable_mockModule('../src/middlewares/protect.route.js', () => ({
  default: mockProtect
}));

// Importa o módulo a ser testado
const { default: usuario } = await import('../src/routes/usuario.routes.js');

// Configuração da aplicação de teste
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(usuario);

describe('Usuario Routes - Testes de Integração', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /usuario/completar', () => {
    
    const dadosCompletos = {
      nome: 'João da Silva',
      nascimento: '1990-05-15',
      telefone: '71987654321',
      cpf: '12345678900',
      endereco: {
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: 'Apto 45',
        bairro: 'Centro',
        cidade: 'Camaçari',
        estado: 'BA',
        cep: '42800000'
      }
    };

    test('deve completar cadastro com todos os dados válidos', async () => {
      // Mock do getUser
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'joao@email.com' } },
        error: null
      });

      // Mock da inserção em 'cliente'
      const mockClienteInsert = jest.fn().mockResolvedValue({ error: null });
      
      // Mock da inserção em 'cliente_endereco'
      const mockEnderecoInsert = jest.fn().mockResolvedValue({ error: null });

      // Configura o mock do from para retornar diferentes mocks
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'cliente') {
          return { insert: mockClienteInsert };
        }
        if (table === 'cliente_endereco') {
          return { insert: mockEnderecoInsert };
        }
      });

      // Mock do updateUser
      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosCompletos);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Cadastro finalizado com sucesso!');

      // Verifica se getUser foi chamado
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('mock-token');

      // Verifica inserção no cliente
      expect(mockSupabase.from).toHaveBeenCalledWith('cliente');
      expect(mockClienteInsert).toHaveBeenCalledWith({
        cliente_id: 'user-123',
        cliente_nome: 'João da Silva',
        cliente_nascimento: '1990-05-15',
        cliente_telefone: '71987654321',
        cliente_cpf: '12345678900'
      });

      // Verifica inserção no endereço
      expect(mockSupabase.from).toHaveBeenCalledWith('cliente_endereco');
      expect(mockEnderecoInsert).toHaveBeenCalledWith({
        cliente_id: 'user-123',
        endereco_logradouro: 'Rua das Flores',
        endereco_numero: '123',
        endereco_complemento: 'Apto 45',
        endereco_bairro: 'Centro',
        endereco_cidade: 'Camaçari',
        endereco_estado: 'BA',
        endereco_cep: '42800000'
      });

      // Verifica se atualizou os metadados do usuário
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { full_user_access: true }
      });
    });

    test('deve rejeitar requisição sem token de acesso', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No token' }
      });

      const response = await request(app)
        .post('/usuario/completar')
        .send(dadosCompletos);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Usuário não autenticado.');
    });

    test('deve rejeitar requisição com usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=invalid-token'])
        .send(dadosCompletos);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Usuário não autenticado.');
    });

    test('deve rejeitar requisição sem campo nome', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const dadosSemNome = { ...dadosCompletos };
      delete dadosSemNome.nome;

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosSemNome);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Todos os campos do formulário são obrigatórios.');
    });

    test('deve rejeitar requisição sem campo nascimento', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const dadosSemNascimento = { ...dadosCompletos };
      delete dadosSemNascimento.nascimento;

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosSemNascimento);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Todos os campos do formulário são obrigatórios.');
    });

    test('deve rejeitar requisição sem campo telefone', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const dadosSemTelefone = { ...dadosCompletos };
      delete dadosSemTelefone.telefone;

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosSemTelefone);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Todos os campos do formulário são obrigatórios.');
    });

    test('deve rejeitar requisição sem campo cpf', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const dadosSemCpf = { ...dadosCompletos };
      delete dadosSemCpf.cpf;

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosSemCpf);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Todos os campos do formulário são obrigatórios.');
    });

    test('deve rejeitar requisição sem campo endereco', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const dadosSemEndereco = { ...dadosCompletos };
      delete dadosSemEndereco.endereco;

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosSemEndereco);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Todos os campos do formulário são obrigatórios.');
    });

    test('deve retornar erro 409 se perfil já existe (duplicação)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const mockClienteInsert = jest.fn().mockResolvedValue({
        error: { code: '23505', message: 'duplicate key value' }
      });

      mockSupabase.from.mockReturnValue({
        insert: mockClienteInsert
      });

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosCompletos);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('O perfil para este usuário já existe.');
    });

    test('deve retornar erro 500 se falhar ao salvar perfil', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const mockClienteInsert = jest.fn().mockResolvedValue({
        error: { code: 'PGRST116', message: 'Database error' }
      });

      mockSupabase.from.mockReturnValue({
        insert: mockClienteInsert
      });

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosCompletos);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Não foi possível salvar as informações do perfil.');
    });

    test('deve retornar erro 500 se perfil for salvo mas endereço falhar', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const mockClienteInsert = jest.fn().mockResolvedValue({ error: null });
      const mockEnderecoInsert = jest.fn().mockResolvedValue({
        error: { message: 'Address insert failed' }
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'cliente') {
          return { insert: mockClienteInsert };
        }
        if (table === 'cliente_endereco') {
          return { insert: mockEnderecoInsert };
        }
      });

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosCompletos);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Perfil salvo, mas não foi possível salvar o endereço.');
    });

    test('deve funcionar mesmo se updateUser falhar (atualização de metadados é opcional)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const mockClienteInsert = jest.fn().mockResolvedValue({ error: null });
      const mockEnderecoInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'cliente') {
          return { insert: mockClienteInsert };
        }
        if (table === 'cliente_endereco') {
          return { insert: mockEnderecoInsert };
        }
      });

      // updateUser falha, mas não deve afetar o resultado
      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Update failed' }
      });

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosCompletos);

      // Deve ter sucesso mesmo com falha no updateUser
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Cadastro finalizado com sucesso!');
    });

    test('deve aceitar endereço sem complemento (campo opcional)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      const mockClienteInsert = jest.fn().mockResolvedValue({ error: null });
      const mockEnderecoInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'cliente') {
          return { insert: mockClienteInsert };
        }
        if (table === 'cliente_endereco') {
          return { insert: mockEnderecoInsert };
        }
      });

      mockSupabase.auth.updateUser.mockResolvedValue({ error: null });

      const dadosSemComplemento = {
        ...dadosCompletos,
        endereco: {
          ...dadosCompletos.endereco,
          complemento: ''
        }
      };

      const response = await request(app)
        .post('/usuario/completar')
        .set('Cookie', ['sb-access-token=mock-token'])
        .send(dadosSemComplemento);

      expect(response.status).toBe(201);
      expect(mockEnderecoInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          endereco_complemento: ''
        })
      );
    });
  });
});