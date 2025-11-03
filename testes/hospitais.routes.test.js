// testes/hospitais.routes.test.js
import request from 'supertest';
import express from 'express';
import showH from '../src/routes/hospitais.routes.js';
import { createClient } from '@supabase/supabase-js';

// MOCK: Faz o Jest interceptar a chamada ao Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Hospitais Routes Tests', () => {
  let app;
  let mockSupabase;

  beforeEach(() => {
    // Configuração básica do Express
    app = express();
    app.use(express.json());
    app.use('/', showH);

    // Criação do mock do Supabase
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };

    // Injeta o mock na função createClient
    createClient.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------
  // TESTES /hospitais
  // -----------------------
  describe('POST /hospitais', () => {
    test('CASO 1: Deve retornar dados dos hospitais com sucesso', async () => {
      const mockHospitais = [
        {
          HOSPITAL_CAPACIDADE_MAX: 100,
          HOSPITAL_CAPACIDADE_ATUAL: 75,
          HOSPITAL_TEMPO_ESPERA: 30,
        },
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockHospitais,
        error: null,
      });

      const response = await request(app)
        .post('/hospitais')
        .expect(200);

      expect(response.body).toEqual(mockHospitais);
      expect(mockSupabase.from).toHaveBeenCalledWith('HOSPITAL');
      expect(mockSupabase.select).toHaveBeenCalledWith(
        'HOSPITAL_CAPACIDADE_MAX, HOSPITAL_CAPACIDADE_ATUAL, HOSPITAL_TEMPO_ESPERA'
      );
    });

    test('CASO 3: Deve retornar erro 500 quando há erro no banco', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Erro ao buscar dados' },
      });

      const response = await request(app)
        .post('/hospitais')
        .expect(500);

      expect(response.body).toHaveProperty('erro');
      expect(response.body.erro).toBe('Erro ao buscar dados');
    });
  });

  // -----------------------
  // TESTES /avaliacoes
  // -----------------------
  describe('POST /avaliacoes', () => {
    test('CASO 8: Deve retornar avaliações dos hospitais com sucesso', async () => {
      const mockAvaliacoes = [
        {
          AVALIACAO_LOTACAO: 8,
          AVALIACAO_TEMPO_ESPERA: 6,
          NOTA: 7.5,
          AVALIACAO_INFRA: 9,
        },
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockAvaliacoes,
        error: null,
      });

      const response = await request(app)
        .post('/avaliacoes')
        .expect(200);

      expect(response.body).toEqual(mockAvaliacoes);
      expect(mockSupabase.from).toHaveBeenCalledWith('AVALIACAO_HOSPITAL');
      expect(mockSupabase.select).toHaveBeenCalledWith(
        'AVALIACAO_LOTACAO, AVALIACAO_TEMPO_ESPERA, NOTA, AVALIACAO_INFRA'
      );
    });

    test('CASO 10: Deve retornar erro 500 quando há erro no banco (avaliacoes)', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Tabela não encontrada' },
      });

      const response = await request(app)
        .post('/avaliacoes')
        .expect(500);

      expect(response.body).toHaveProperty('erro');
      expect(response.body.erro).toBe('Tabela não encontrada');
    });
  });
});
