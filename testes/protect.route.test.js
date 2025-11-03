import { jest } from '@jest/globals';
import supabase from '../src/db/supabase.js';
import protect from '../src/middlewares/protect.route.js';
import getCurrentUser from '../src/middlewares/getCurrentUser.js';
import dadosUsuarioService from '../src/middlewares/dadosUsuario.js'; 

const mockSupabase = {
  auth: {
    // Agora 'jest.fn()' funciona
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

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
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await protect.partially(req, res, next);

      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.redirect).not.toHaveBeenCalled();
      expect(res.clearCookie).not.toHaveBeenCalled();
    });

    test('CASO 2: Deve redirecionar quando não há token', async () => {
      await protect.partially(req, res, next);

      expect(supabase.auth.getUser).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('sb-access-token');
      expect(res.clearCookie).toHaveBeenCalledWith('sb-refresh-token');
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });

    test('CASO 3: Deve redirecionar quando token é inválido', async () => {
      req.cookies['sb-access-token'] = 'invalid-token';
      supabase.auth.getUser.mockResolvedValue({
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
      supabase.auth.getUser.mockRejectedValue(new Error('Network error'));

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
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await protect.entirely[0](req, res, next);
      
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
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await protect.entirely[0](req, res, next);
      
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
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await protect.entirely[0](req, res, next);
      
      if (next.mock.calls.length > 0) {
        next.mockClear();
        await protect.entirely[1](req, res, next);
      }

      expect(res.redirect).toHaveBeenCalledWith('/cadastro/info');
    });
  });
});