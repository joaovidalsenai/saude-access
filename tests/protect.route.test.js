import { jest } from '@jest/globals';

// 1. CRIAR O MOCK ANTES de importar qualquer coisa que use o supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

// 2. Mockar o módulo supabase ANTES de importar os middlewares
jest.unstable_mockModule('../src/db/supabase.js', () => ({
  default: {
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  },
}));

// 3. AGORA podemos importar os middlewares (eles receberão o mock)
const { default: protect } = await import('../src/middlewares/protect.route.js');

describe('Authentication Middlewares Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      user: null,
    };

    res = {
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
    
    // Limpar todos os mocks entre os testes
    jest.clearAllMocks();
  });

  describe('protect.partially (authenticateUser)', () => {
    
    test('CASO 1: Deve autenticar usuário com token válido', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {},
      };
      
      req.cookies['sb-access-token'] = 'valid-token';
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await protect.partially(req, res, next);

      expect(mockGetUser).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(res.clearCookie).not.toHaveBeenCalled();
    });

    test('CASO 2: Deve redirecionar quando não há token', async () => {
      await protect.partially(req, res, next);

      expect(mockGetUser).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('sb-access-token');
      expect(res.clearCookie).toHaveBeenCalledWith('sb-refresh-token');
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });

    test('CASO 3: Deve redirecionar quando token é inválido', async () => {
      req.cookies['sb-access-token'] = 'invalid-token';
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await protect.partially(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });

    test('CASO 4: Deve capturar exceções inesperadas', async () => {
      req.cookies['sb-access-token'] = 'token-that-crashes';
      mockGetUser.mockRejectedValue(new Error('Network error'));

      await protect.partially(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('protect.entirely (authenticateUser + authorizeFullAccess)', () => {
    
    test('CASO 5: Deve permitir acesso total quando usuário tem full_user_access', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          full_user_access: true,
        },
      };
      
      req.cookies['sb-access-token'] = 'valid-token';
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Executar o primeiro middleware (authenticateUser)
      await protect.entirely[0](req, res, next);
      
      // Se next foi chamado, executar o segundo middleware (authorizeFullAccess)
      if (next.mock.calls.length > 0) {
        next.mockClear();
        await protect.entirely[1](req, res, next);
      }

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('CASO 6: Deve redirecionar para /cadastro/info quando full_user_access é false', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          full_user_access: false,
        },
      };
      
      req.cookies['sb-access-token'] = 'valid-token';
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Executar o primeiro middleware
      await protect.entirely[0](req, res, next);
      
      // Se next foi chamado, executar o segundo middleware
      if (next.mock.calls.length > 0) {
        next.mockClear();
        await protect.entirely[1](req, res, next);
      }

      expect(res.redirect).toHaveBeenCalledWith('/cadastro/info');
      expect(next).not.toHaveBeenCalled();
    });

    test('CASO 7: Deve redirecionar quando full_user_access não está definido', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {},
      };
      
      req.cookies['sb-access-token'] = 'valid-token';
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Executar o primeiro middleware
      await protect.entirely[0](req, res, next);
      
      // Se next foi chamado, executar o segundo middleware
      if (next.mock.calls.length > 0) {
        next.mockClear();
        await protect.entirely[1](req, res, next);
      }

      expect(res.redirect).toHaveBeenCalledWith('/cadastro/info');
    });
  });
});