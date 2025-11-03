// Mock DEVE vir ANTES dos imports dos módulos da aplicação
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
};

const mockProtect = {
  entirely: jest.fn((req, res, next) => next())
};

jest.mock('../src/db/supabase.js', () => ({
  __esModule: true,
  default: mockSupabase
}));

jest.mock('../src/middlewares/protect.route.js', () => ({
  __esModule: true,
  default: mockProtect
}));

// Agora importa depois dos mocks - CORRIGIDO: caminho com /src/
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import avaliacao from '../src/routes/avaliar.routes.js';

describe('Rotas de Avaliação', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/avaliacao', avaliacao);
    jest.clearAllMocks();
  });

  describe('POST /api/avaliacao/avaliar/hospital', () => {
    const mockUser = { id: 'user-123' };
    const validPayload = {
      hospital_id: 'hospital-1',
      avaliacao_lotacao: 4,
      avaliacao_tempo_espera: 3,
      avaliacao_atendimento: 5,
      avaliacao_infraestrutura: 4
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
    });

    test('deve registrar avaliação com sucesso', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/hospital')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Avaliação registrada com sucesso!'
      });
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-token');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          hospital_id: validPayload.hospital_id,
          cliente_id: mockUser.id,
          avaliacao_lotacao: validPayload.avaliacao_lotacao,
          avaliacao_tempo_espera: validPayload.avaliacao_tempo_espera,
          avaliacao_atendimento: validPayload.avaliacao_atendimento,
          avaliacao_infraestrutura: validPayload.avaliacao_infraestrutura,
          avaliacao_data: expect.any(String)
        })
      );
    });

    test('deve retornar erro 401 se usuário não estiver autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/hospital')
        .set('Cookie', ['sb-access-token=invalid-token'])
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Usuário não autenticado. Apenas usuários logados podem avaliar.'
      });
    });

    test('deve retornar erro 400 se faltar campo obrigatório (hospital_id)', async () => {
      const invalidPayload = { ...validPayload };
      delete invalidPayload.hospital_id;

      const response = await request(app)
        .post('/api/avaliacao/avaliar/hospital')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Todos os campos da avaliação são obrigatórios');
    });

    test('deve retornar erro 400 se faltar campo obrigatório (avaliacao_lotacao)', async () => {
      const invalidPayload = { ...validPayload };
      delete invalidPayload.avaliacao_lotacao;

      const response = await request(app)
        .post('/api/avaliacao/avaliar/hospital')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Todos os campos da avaliação são obrigatórios');
    });

    test('deve retornar erro 404 se hospital não existir (FK violation)', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        error: { code: '23503', message: 'Foreign key violation' }
      });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/hospital')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(validPayload);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'O hospital ou o cliente especificado não existe.'
      });
    });

    test('deve retornar erro 500 para erro genérico do banco', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        error: { code: 'XXXX', message: 'Database error' }
      });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/hospital')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Não foi possível registrar a sua avaliação.'
      });
    });

    test('deve aceitar avaliações com valores zero', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      const payloadComZeros = {
        hospital_id: 'hospital-1',
        avaliacao_lotacao: 0,
        avaliacao_tempo_espera: 0,
        avaliacao_atendimento: 0,
        avaliacao_infraestrutura: 0
      };

      const response = await request(app)
        .post('/api/avaliacao/avaliar/hospital')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(payloadComZeros);

      expect(response.status).toBe(201);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          avaliacao_lotacao: 0,
          avaliacao_tempo_espera: 0
        })
      );
    });
  });

  describe('POST /api/avaliacao/avaliar/especialidade', () => {
    const mockUser = { id: 'user-456' };
    const validPayload = {
      hospital_id: 'hospital-1',
      especialidade_id: 'especialidade-1',
      especialidade_status: 'DISPONIVEL',
      tempo_espera_estimado: 30
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
    });

    test('deve registrar status de especialidade com sucesso', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { hospital_id: 'hospital-1' },
        error: null
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Status da especialidade reportado com sucesso!');
      expect(response.body.dados).toEqual({
        hospital_id: validPayload.hospital_id,
        especialidade_id: validPayload.especialidade_id,
        status: validPayload.especialidade_status,
        tempo_espera: validPayload.tempo_espera_estimado
      });
    });

    test('deve retornar erro 401 se usuário não estiver autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=invalid-token'])
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Usuário não autenticado. Apenas usuários logados podem reportar.'
      });
    });

    test('deve retornar erro 400 se faltar campos obrigatórios', async () => {
      const invalidPayload = {
        hospital_id: 'hospital-1'
      };

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Campos obrigatórios');
    });

    test('deve retornar erro 400 para status inválido', async () => {
      const invalidPayload = {
        ...validPayload,
        especialidade_status: 'STATUS_INVALIDO'
      };

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Status inválido');
    });

    test('deve aceitar todos os status válidos', async () => {
      const statusValidos = ['DISPONIVEL', 'EM_FALTA', 'LIMITADA'];

      for (const status of statusValidos) {
        jest.clearAllMocks();
        
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        });

        const mockSingle = jest.fn().mockResolvedValue({
          data: { hospital_id: 'hospital-1' },
          error: null
        });
        const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
        const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
        
        mockSupabase.from.mockReturnValueOnce({
          select: mockSelect
        });

        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        mockSupabase.from.mockReturnValueOnce({
          insert: mockInsert
        });

        const response = await request(app)
          .post('/api/avaliacao/avaliar/especialidade')
          .set('Cookie', ['sb-access-token=valid-token'])
          .send({ ...validPayload, especialidade_status: status });

        expect(response.status).toBe(201);
      }
    });

    test('deve retornar erro 404 se especialidade não existir no hospital', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Not found')
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(validPayload);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'A especialidade especificada não está disponível neste hospital.'
      });
    });

    test('deve retornar erro 409 para report duplicado (mesmo dia)', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { hospital_id: 'hospital-1' },
        error: null
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect
      });

      const mockInsert = jest.fn().mockResolvedValue({
        error: { code: '23505', message: 'Unique constraint violation' }
      });
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(validPayload);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'Você já reportou o status desta especialidade hoje. Tente novamente amanhã.'
      });
    });

    test('deve retornar erro 404 para FK violation', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { hospital_id: 'hospital-1' },
        error: null
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect
      });

      const mockInsert = jest.fn().mockResolvedValue({
        error: { code: '23503', message: 'Foreign key violation' }
      });
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(validPayload);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Hospital, especialidade ou cliente especificado não existe.'
      });
    });

    test('deve aceitar payload sem tempo_espera_estimado', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { hospital_id: 'hospital-1' },
        error: null
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect
      });

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const payloadSemTempo = {
        hospital_id: 'hospital-1',
        especialidade_id: 'especialidade-1',
        especialidade_status: 'DISPONIVEL'
      };

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(payloadSemTempo);

      expect(response.status).toBe(201);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tempo_espera_estimado: null
        })
      );
    });

    test('deve retornar erro 500 para erro genérico do banco', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: { hospital_id: 'hospital-1' },
        error: null
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      
      mockSupabase.from.mockReturnValueOnce({
        select: mockSelect
      });

      const mockInsert = jest.fn().mockResolvedValue({
        error: { code: 'XXXX', message: 'Generic error' }
      });
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert
      });

      const response = await request(app)
        .post('/api/avaliacao/avaliar/especialidade')
        .set('Cookie', ['sb-access-token=valid-token'])
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Não foi possível registrar o status da especialidade.'
      });
    });
  });
});