import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser } from '../src/middlewares/getCurrentUser.js';
import { jest } from '@jest/globals';
import supabase from '../src/db/supabase.js';

// Mock do módulo supabase
vi.mock('../src/db/supabase.js', () => ({
  default: {
    auth: {
      getUser: vi.fn()
    }
  }
}));

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar erro quando o token não é fornecido', async () => {
    const req = {
      cookies: {}
    };

    const result = await getCurrentUser(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Token não fornecido');
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando o cookie sb-access-token está ausente', async () => {
    const req = {
      cookies: {
        'other-cookie': 'value'
      }
    };

    const result = await getCurrentUser(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Token não fornecido');
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('deve retornar o usuário quando o token é válido', async () => {
    const mockUser = {
      id: '123',
      email: 'usuario@exemplo.com',
      created_at: '2024-01-01'
    };

    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    const req = {
      cookies: {
        'sb-access-token': 'valid-token-123'
      }
    };

    const result = await getCurrentUser(req);

    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeNull();
    expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('deve retornar erro quando o Supabase retorna erro', async () => {
    const mockError = new Error('Token inválido');

    supabase.auth.getUser.mockResolvedValue({
      data: null,
      error: mockError
    });

    const req = {
      cookies: {
        'sb-access-token': 'invalid-token'
      }
    };

    const result = await getCurrentUser(req);

    expect(result.user).toBeNull();
    expect(result.error).toEqual(mockError);
    expect(supabase.auth.getUser).toHaveBeenCalledWith('invalid-token');
  });

  it('deve retornar null para user quando data.user é undefined', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: {},
      error: null
    });

    const req = {
      cookies: {
        'sb-access-token': 'some-token'
      }
    };

    const result = await getCurrentUser(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeNull();
  });

  it('deve retornar null para user quando data é null', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: null,
      error: null
    });

    const req = {
      cookies: {
        'sb-access-token': 'some-token'
      }
    };

    const result = await getCurrentUser(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeNull();
  });

  it('deve lidar com token vazio', async () => {
    const req = {
      cookies: {
        'sb-access-token': ''
      }
    };

    const result = await getCurrentUser(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Token não fornecido');
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it('deve lidar com req.cookies sendo undefined', async () => {
    const req = {};

    const result = await getCurrentUser(req);

    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Token não fornecido');
  });
});