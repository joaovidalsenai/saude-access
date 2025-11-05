// testes/dadosUsuario.test.js
import { jest } from '@jest/globals';

// 1. Mock do Supabase ANTES de importar o serviço
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const supabaseMock = {
    auth: {
        getUser: mockGetUser
    },
    from: mockFrom
};

// Mock do módulo supabase
jest.unstable_mockModule('../src/db/supabase.js', () => ({
    default: supabaseMock
}));

// 2. Importação do serviço DEPOIS do mock
const { default: dadosUsuario, AuthError, NotFoundError } = await import('../src/middlewares/dadosUsuario.js');

describe('dadosUsuario', () => {
    beforeEach(() => {
        // Limpa os mocks antes de cada teste
        jest.clearAllMocks();
        
        // Configura o encadeamento de métodos do Supabase
        mockFrom.mockReturnValue({ select: mockSelect });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ single: mockSingle });
    });

    describe('Validação do token', () => {
        test('deve lançar AuthError quando token não é fornecido', async () => {
            await expect(dadosUsuario(null)).rejects.toThrow(AuthError);
            await expect(dadosUsuario(null)).rejects.toThrow('Token de acesso não fornecido.');
        });

        test('deve lançar AuthError quando token está vazio', async () => {
            await expect(dadosUsuario('')).rejects.toThrow(AuthError);
        });
    });

    describe('Autenticação do usuário', () => {
        test('deve lançar AuthError quando usuário não está autenticado', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: null },
                error: { message: 'Token inválido' }
            });

            await expect(dadosUsuario('token-invalido')).rejects.toThrow(AuthError);
            await expect(dadosUsuario('token-invalido')).rejects.toThrow('Usuário não autenticado ou token inválido.');
        });

        test('deve lançar AuthError quando token é inválido', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: null },
                error: null
            });

            await expect(dadosUsuario('token-invalido')).rejects.toThrow(AuthError);
        });
    });

    describe('Busca de dados do perfil', () => {
        const mockUser = {
            id: 'user-123',
            email: 'teste@email.com'
        };

        beforeEach(() => {
            mockGetUser.mockResolvedValue({
                data: { user: mockUser },
                error: null
            });
        });

        test('deve lançar NotFoundError quando perfil não é encontrado', async () => {
            mockSingle.mockResolvedValue({
                data: null,
                error: { message: 'Perfil não encontrado' }
            });

            await expect(dadosUsuario('token-valido')).rejects.toThrow(NotFoundError);
            await expect(dadosUsuario('token-valido')).rejects.toThrow('Perfil do usuário não encontrado.');
        });

        test('deve lançar NotFoundError quando dados do perfil são nulos', async () => {
            mockSingle.mockResolvedValue({
                data: null,
                error: null
            });

            await expect(dadosUsuario('token-valido')).rejects.toThrow(NotFoundError);
        });

        test('deve retornar perfil completo quando dados são encontrados', async () => {
            const mockPerfil = {
                cliente_id: 'user-123',
                nome: 'João Silva',
                cpf: '12345678900',
                telefone: '71999999999',
                cliente_endereco: [
                    {
                        rua: 'Rua Teste',
                        numero: '123',
                        cidade: 'Salvador',
                        estado: 'BA',
                        cep: '40000-000'
                    }
                ]
            };

            mockSingle.mockResolvedValue({
                data: mockPerfil,
                error: null
            });

            const resultado = await dadosUsuario('token-valido');

            // Verifica que o resultado contém os campos esperados
            expect(resultado.cliente_id).toBe('user-123');
            expect(resultado.nome).toBe('João Silva');
            expect(resultado.cpf).toBe('12345678900');
            expect(resultado.telefone).toBe('71999999999');
            expect(resultado.email).toBe('teste@email.com');
            expect(resultado.endereco).toEqual([
                {
                    rua: 'Rua Teste',
                    numero: '123',
                    cidade: 'Salvador',
                    estado: 'BA',
                    cep: '40000-000'
                }
            ]);

            // Verifica que cliente_endereco foi removido
            expect(resultado.cliente_endereco).toBeUndefined();
            expect(resultado.enderecos).toBeUndefined();
        });

        test('deve chamar Supabase com parâmetros corretos', async () => {
            mockSingle.mockResolvedValue({
                data: { cliente_id: 'user-123', nome: 'Teste', cliente_endereco: [] },
                error: null
            });

            await dadosUsuario('token-valido');

            expect(mockGetUser).toHaveBeenCalledWith('token-valido');
            expect(mockFrom).toHaveBeenCalledWith('cliente');
            expect(mockSelect).toHaveBeenCalledWith('*, cliente_endereco (*)');
            expect(mockEq).toHaveBeenCalledWith('cliente_id', 'user-123');
            expect(mockSingle).toHaveBeenCalled();
        });
    });

    describe('Formatação dos dados', () => {
        const mockUser = {
            id: 'user-123',
            email: 'teste@email.com'
        };

        beforeEach(() => {
            mockGetUser.mockResolvedValue({
                data: { user: mockUser },
                error: null
            });
        });

        test('deve incluir email do usuário no perfil', async () => {
            mockSingle.mockResolvedValue({
                data: {
                    cliente_id: 'user-123',
                    nome: 'Teste',
                    cliente_endereco: []
                },
                error: null
            });

            const resultado = await dadosUsuario('token-valido');

            expect(resultado.email).toBe('teste@email.com');
        });

        test('deve renomear cliente_endereco para endereco', async () => {
            const enderecosMock = [{ rua: 'Rua A' }, { rua: 'Rua B' }];
            
            mockSingle.mockResolvedValue({
                data: {
                    cliente_id: 'user-123',
                    nome: 'Teste',
                    cliente_endereco: enderecosMock
                },
                error: null
            });

            const resultado = await dadosUsuario('token-valido');

            // Verifica que endereco foi criado corretamente
            expect(resultado.endereco).toEqual(enderecosMock);
            
            // Verifica que cliente_endereco foi removido
            expect(resultado.cliente_endereco).toBeUndefined();
        });

        test('deve preservar todos os campos do cliente', async () => {
            mockSingle.mockResolvedValue({
                data: {
                    cliente_id: 'user-123',
                    nome: 'João Silva',
                    cpf: '12345678900',
                    telefone: '71999999999',
                    data_nascimento: '1990-01-01',
                    cliente_endereco: []
                },
                error: null
            });

            const resultado = await dadosUsuario('token-valido');

            expect(resultado).toMatchObject({
                cliente_id: 'user-123',
                nome: 'João Silva',
                cpf: '12345678900',
                telefone: '71999999999',
                data_nascimento: '1990-01-01'
            });
        });
    });
});