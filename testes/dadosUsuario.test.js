
import dadosUsuario, { AuthError, NotFoundError } from '../src/middlewares/dadosUsuario.js';
import { jest } from '@jest/globals';

// Mock do Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

// Mock do módulo supabase
jest.mock('../src/db/supabase.js', () => mockSupabase);

describe('dadosUsuario Service', () => {
  let mockFrom;
  let mockSelect;
  let mockEq;
  let mockSingle;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configura os mocks encadeados do Supabase
    mockSingle = jest.fn();
    mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    mockSupabase.from = mockFrom;
  });

  describe('Custom Error Classes', () => {
    test('AuthError should be instance of Error', () => {
      const error = new AuthError('Test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AuthError');
      expect(error.message).toBe('Test message');
    });

    test('NotFoundError should be instance of Error', () => {
      const error = new NotFoundError('Test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Test message');
    });
  });

  describe('Token Validation', () => {
    test('should throw AuthError when token is not provided', async () => {
      await expect(dadosUsuario()).rejects.toThrow(AuthError);
      await expect(dadosUsuario()).rejects.toThrow('Token de acesso não fornecido.');
    });

    test('should throw AuthError when token is null', async () => {
      await expect(dadosUsuario(null)).rejects.toThrow(AuthError);
      await expect(dadosUsuario(null)).rejects.toThrow('Token de acesso não fornecido.');
    });

    test('should throw AuthError when token is empty string', async () => {
      await expect(dadosUsuario('')).rejects.toThrow(AuthError);
      await expect(dadosUsuario('')).rejects.toThrow('Token de acesso não fornecido.');
    });

    test('should throw AuthError when token is undefined', async () => {
      await expect(dadosUsuario(undefined)).rejects.toThrow(AuthError);
      await expect(dadosUsuario(undefined)).rejects.toThrow('Token de acesso não fornecido.');
    });
  });

  describe('User Authentication', () => {
    test('should authenticate user with valid token', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: {
          cliente_id: 'user-123',
          nome: 'Test User',
          cliente_endereco: [],
        },
        error: null,
      });

      await dadosUsuario('valid-token');

      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-token');
    });

    test('should throw AuthError when authentication fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await expect(dadosUsuario('invalid-token')).rejects.toThrow(AuthError);
      await expect(dadosUsuario('invalid-token')).rejects.toThrow(
        'Usuário não autenticado ou token inválido.'
      );
    });

    test('should throw AuthError when user is null', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(dadosUsuario('token')).rejects.toThrow(AuthError);
    });

    test('should throw AuthError when getUser returns error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      });

      await expect(dadosUsuario('expired-token')).rejects.toThrow(AuthError);
    });
  });

  describe('Profile Data Retrieval', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    test('should fetch profile data from database', async () => {
      const mockPerfil = {
        cliente_id: 'user-123',
        nome: 'João Silva',
        telefone: '11999999999',
        cliente_endereco: [
          {
            endereco_id: '1',
            rua: 'Rua Principal',
            numero: '100',
            cidade: 'São Paulo',
          },
        ],
      };

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(mockSupabase.from).toHaveBeenCalledWith('cliente');
      expect(mockSelect).toHaveBeenCalledWith('*, cliente_endereco (*)');
      expect(mockEq).toHaveBeenCalledWith('cliente_id', 'user-123');
      expect(mockSingle).toHaveBeenCalled();
      expect(resultado).toBeDefined();
    });

    test('should throw NotFoundError when profile is not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' },
      });

      await expect(dadosUsuario('valid-token')).rejects.toThrow(NotFoundError);
      await expect(dadosUsuario('valid-token')).rejects.toThrow(
        'Perfil do usuário não encontrado.'
      );
    });

    test('should throw NotFoundError when database returns error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(dadosUsuario('valid-token')).rejects.toThrow(NotFoundError);
    });

    test('should throw NotFoundError when data is null', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(dadosUsuario('valid-token')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Data Formatting', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    test('should format profile data correctly', async () => {
      const mockPerfil = {
        cliente_id: 'user-123',
        nome: 'João Silva',
        telefone: '11999999999',
        cliente_endereco: [
          {
            endereco_id: '1',
            rua: 'Rua Principal',
            numero: '100',
          },
        ],
      };

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(resultado).toHaveProperty('cliente_id', 'user-123');
      expect(resultado).toHaveProperty('nome', 'João Silva');
      expect(resultado).toHaveProperty('telefone', '11999999999');
      expect(resultado).toHaveProperty('email', 'test@example.com');
      expect(resultado).toHaveProperty('endereco');
    });

    test('should include user email in formatted data', async () => {
      const mockPerfil = {
        cliente_id: 'user-123',
        nome: 'João Silva',
        cliente_endereco: [],
      };

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(resultado.email).toBe('test@example.com');
    });

    test('should rename cliente_endereco to endereco', async () => {
      const mockEndereco = [
        {
          endereco_id: '1',
          rua: 'Rua A',
          numero: '123',
        },
      ];

      const mockPerfil = {
        cliente_id: 'user-123',
        nome: 'João Silva',
        cliente_endereco: mockEndereco,
      };

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(resultado.endereco).toEqual(mockEndereco);
      expect(resultado).not.toHaveProperty('enderecos');
    });

    test('should remove enderecos property if exists', async () => {
      const mockPerfil = {
        cliente_id: 'user-123',
        nome: 'João Silva',
        cliente_endereco: [],
        enderecos: 'should be deleted',
      };

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(resultado).not.toHaveProperty('enderecos');
    });

    test('should handle empty address array', async () => {
      const mockPerfil = {
        cliente_id: 'user-123',
        nome: 'João Silva',
        cliente_endereco: [],
      };

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(resultado.endereco).toEqual([]);
      expect(Array.isArray(resultado.endereco)).toBe(true);
    });

    test('should handle multiple addresses', async () => {
      const mockEnderecos = [
        {
          endereco_id: '1',
          rua: 'Rua A',
          numero: '123',
          cidade: 'São Paulo',
        },
        {
          endereco_id: '2',
          rua: 'Rua B',
          numero: '456',
          cidade: 'Rio de Janeiro',
        },
      ];

      const mockPerfil = {
        cliente_id: 'user-123',
        nome: 'João Silva',
        cliente_endereco: mockEnderecos,
      };

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(resultado.endereco).toHaveLength(2);
      expect(resultado.endereco).toEqual(mockEnderecos);
    });
  });

  describe('Complete Flow Integration', () => {
    test('should complete full flow successfully', async () => {
      const mockUser = { id: 'user-456', email: 'maria@example.com' };
      const mockPerfil = {
        cliente_id: 'user-456',
        nome: 'Maria Santos',
        telefone: '21988888888',
        cpf: '123.456.789-00',
        cliente_endereco: [
          {
            endereco_id: '1',
            rua: 'Av. Brasil',
            numero: '500',
            complemento: 'Apto 101',
            bairro: 'Centro',
            cidade: 'Rio de Janeiro',
            estado: 'RJ',
            cep: '20000-000',
          },
        ],
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token-456');

      expect(resultado).toEqual({
        cliente_id: 'user-456',
        nome: 'Maria Santos',
        telefone: '21988888888',
        cpf: '123.456.789-00',
        email: 'maria@example.com',
        endereco: mockPerfil.cliente_endereco,
      });
    });

    test('should handle user without address', async () => {
      const mockUser = { id: 'user-789', email: 'pedro@example.com' };
      const mockPerfil = {
        cliente_id: 'user-789',
        nome: 'Pedro Oliveira',
        telefone: '11977777777',
        cliente_endereco: null,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token-789');

      expect(resultado.endereco).toBeNull();
    });
  });

  describe('Error Logging', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      consoleErrorSpy.mockClear();
    });

    afterAll(() => {
      consoleErrorSpy.mockRestore();
    });

    test('should log error when profile fetch fails', async () => {
      const mockError = { message: 'Database error' };
      mockSingle.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(dadosUsuario('valid-token')).rejects.toThrow(NotFoundError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao buscar perfil:',
        'Database error'
      );
    });

    test('should log error even when error message is undefined', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(dadosUsuario('valid-token')).rejects.toThrow(NotFoundError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao buscar perfil:',
        undefined
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle user with special characters in email', async () => {
      const mockUser = { id: 'user-special', email: 'test+123@example.com' };
      const mockPerfil = {
        cliente_id: 'user-special',
        nome: 'Test User',
        cliente_endereco: [],
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(resultado.email).toBe('test+123@example.com');
    });

    test('should handle profile with extra fields', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockPerfil = {
        cliente_id: 'user-123',
        nome: 'Test User',
        telefone: '11999999999',
        cpf: '123.456.789-00',
        data_nascimento: '1990-01-01',
        foto_url: 'https://example.com/photo.jpg',
        cliente_endereco: [],
        extra_field: 'should be preserved',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: mockPerfil,
        error: null,
      });

      const resultado = await dadosUsuario('valid-token');

      expect(resultado.extra_field).toBe('should be preserved');
      expect(resultado).toHaveProperty('data_nascimento');
      expect(resultado).toHaveProperty('foto_url');
    });
  });
});