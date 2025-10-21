-- Sistema de Avaliação de Hospitais - Salvador/BA
-- Limpeza do banco (ordem respeitando FKs)
DROP TABLE IF EXISTS AVALIACAO_ESPECIALIDADE CASCADE;
DROP TABLE IF EXISTS AVALIACAO_HOSPITAL CASCADE;
DROP TABLE IF EXISTS HOSPITAL_ESPECIALIDADE CASCADE;
DROP TABLE IF EXISTS CLIENTE_ENDERECO CASCADE;
DROP TABLE IF EXISTS HOSPITAL_CONTATO CASCADE;
DROP TABLE IF EXISTS HOSPITAL_ENDERECO CASCADE;
DROP TABLE IF EXISTS ESPECIALIDADE CASCADE;
DROP TABLE IF EXISTS HOSPITAL CASCADE;
DROP TABLE IF EXISTS CLIENTE CASCADE;

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS CLIENTE(
    CLIENTE_ID UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    CLIENTE_NOME VARCHAR(70) NOT NULL,
    CLIENTE_CPF VARCHAR(11) UNIQUE NOT NULL,
    CLIENTE_NASCIMENTO DATE NOT NULL,
    CLIENTE_TELEFONE VARCHAR(11) NOT NULL
);

-- Endereços dos Clientes (1:1)
CREATE TABLE IF NOT EXISTS CLIENTE_ENDERECO(
    CLIENTE_ID UUID PRIMARY KEY REFERENCES CLIENTE(CLIENTE_ID) ON DELETE CASCADE,
    ENDERECO_CEP VARCHAR(8) NOT NULL,
    ENDERECO_ESTADO VARCHAR(50) NOT NULL,
    ENDERECO_CIDADE VARCHAR(50),
    ENDERECO_BAIRRO VARCHAR(50) NOT NULL,
    ENDERECO_LOGRADOURO VARCHAR(50) NOT NULL,
    ENDERECO_COMPLEMENTO VARCHAR(50),
    ENDERECO_NUMERO VARCHAR(5)
);

-- Tabela de Hospitais
CREATE TABLE IF NOT EXISTS HOSPITAL(
    HOSPITAL_ID SERIAL PRIMARY KEY,
    HOSPITAL_NOME VARCHAR(50) UNIQUE,
    HOSPITAL_CNPJ VARCHAR(14) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS HOSPITAL_ENDERECO (
    ENDERECO_ID UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    HOSPITAL_ID INT NOT NULL REFERENCES HOSPITAL(HOSPITAL_ID) ON DELETE CASCADE,
    ENDERECO_CEP VARCHAR(8) NOT NULL,
    ENDERECO_BAIRRO VARCHAR(50) NOT NULL,
    ENDERECO_LOGRADOURO VARCHAR(50) NOT NULL,
    ENDERECO_COMPLEMENTO VARCHAR(50),
    ENDERECO_NUMERO VARCHAR(5),
    HOSPITAL_LATITUDE DECIMAL(10, 8),
    HOSPITAL_LONGITUDE DECIMAL(11, 8)
);

ALTER TABLE hospital_endereco 
ADD COLUMN  DECIMAL(10, 8),
ADD COLUMN hospital_longitude DECIMAL(11, 8);

-- Contatos dos Hospitais (1:N)
CREATE TABLE IF NOT EXISTS HOSPITAL_CONTATO(
    CONTATO_ID UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    HOSPITAL_ID INT NOT NULL REFERENCES HOSPITAL(HOSPITAL_ID) ON DELETE CASCADE,
    HOSPITAL_TELEFONE VARCHAR(15) NOT NULL,
    HOSPITAL_EMAIL VARCHAR(50)
);

-- Tabela de Especialidades Médicas
CREATE TABLE IF NOT EXISTS ESPECIALIDADE (
    ESPECIALIDADE_ID SERIAL PRIMARY KEY,
    ESPECIALIDADE_NOME VARCHAR(50) UNIQUE NOT NULL
);

-- Relacionamento N:N Hospital-Especialidade
CREATE TABLE IF NOT EXISTS HOSPITAL_ESPECIALIDADE(
    HOSPITAL_ID INT NOT NULL REFERENCES HOSPITAL(HOSPITAL_ID) ON DELETE CASCADE,
    ESPECIALIDADE_ID INT NOT NULL REFERENCES ESPECIALIDADE(ESPECIALIDADE_ID) ON DELETE CASCADE,
    PRIMARY KEY (HOSPITAL_ID, ESPECIALIDADE_ID)
);

-- Avaliações de status de especialidades por hospital
CREATE TABLE IF NOT EXISTS AVALIACAO_ESPECIALIDADE (
    AVALIACAO_ESP_ID SERIAL PRIMARY KEY,
    CLIENTE_ID UUID NOT NULL REFERENCES CLIENTE(CLIENTE_ID) ON DELETE CASCADE,
    HOSPITAL_ID INT NOT NULL,
    ESPECIALIDADE_ID INT NOT NULL,
    ESPECIALIDADE_STATUS VARCHAR(20) NOT NULL CHECK (ESPECIALIDADE_STATUS IN ('DISPONIVEL', 'EM_FALTA', 'LIMITADA')),
    TEMPO_ESPERA_ESTIMADO INT, -- Em minutos
    AVALIACAO_DATA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (HOSPITAL_ID, ESPECIALIDADE_ID) 
        REFERENCES HOSPITAL_ESPECIALIDADE(HOSPITAL_ID, ESPECIALIDADE_ID) ON DELETE CASCADE
);

-- Avaliações Gerais dos Hospitais
CREATE TABLE IF NOT EXISTS AVALIACAO_HOSPITAL(
    AVALIACAO_ID UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    HOSPITAL_ID INT NOT NULL REFERENCES HOSPITAL(HOSPITAL_ID) ON DELETE CASCADE,
    CLIENTE_ID UUID NOT NULL REFERENCES CLIENTE(CLIENTE_ID) ON DELETE CASCADE,
    AVALIACAO_LOTACAO INT NOT NULL,
    AVALIACAO_TEMPO_ESPERA INT NOT NULL,
    AVALIACAO_ATENDIMENTO INT NOT NULL,
    AVALIACAO_INFRAESTRUTURA INT NOT NULL,
    AVALIACAO_DATA TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índices para performance e controle
CREATE UNIQUE INDEX idx_unique_report_por_dia 
ON AVALIACAO_ESPECIALIDADE(CLIENTE_ID, HOSPITAL_ID, ESPECIALIDADE_ID, (CAST(AVALIACAO_DATA AS DATE)));

CREATE INDEX idx_avaliacao_esp_data_status ON AVALIACAO_ESPECIALIDADE(AVALIACAO_DATA, ESPECIALIDADE_STATUS);
CREATE INDEX idx_avaliacao_esp_hospital_esp ON AVALIACAO_ESPECIALIDADE(HOSPITAL_ID, ESPECIALIDADE_ID);

-- View para alertas de especialidades em falta
CREATE OR REPLACE VIEW vw_alertas_especialidade AS
SELECT 
    h.HOSPITAL_NOME,
    e.ESPECIALIDADE_NOME,
    ae.HOSPITAL_ID,
    ae.ESPECIALIDADE_ID,
    COUNT(*) AS total_reports_falta,
    COUNT(DISTINCT ae.CLIENTE_ID) AS usuarios_diferentes,
    MAX(ae.AVALIACAO_DATA) AS ultimo_report,
    AVG(ae.TEMPO_ESPERA_ESTIMADO) AS tempo_espera_medio
FROM AVALIACAO_ESPECIALIDADE ae
JOIN HOSPITAL h ON ae.HOSPITAL_ID = h.HOSPITAL_ID
JOIN ESPECIALIDADE e ON ae.ESPECIALIDADE_ID = e.ESPECIALIDADE_ID
WHERE 
    ae.ESPECIALIDADE_STATUS = 'EM_FALTA'
    AND ae.AVALIACAO_DATA >= NOW() - INTERVAL '72 hours'
GROUP BY 
    h.HOSPITAL_NOME, e.ESPECIALIDADE_NOME, ae.HOSPITAL_ID, ae.ESPECIALIDADE_ID
HAVING 
    COUNT(*) >= 3 -- Mínimo de 3 reports para gerar alerta
ORDER BY 
    total_reports_falta DESC, usuarios_diferentes DESC;

-- Inserção dos dados: Hospitais públicos de Salvador
INSERT INTO hospital (hospital_nome, hospital_cnpj) VALUES 
-- Hospitais de grande porte
('Hospital Geral Roberto Santos', '13347407000108'),
('Hospital do Subúrbio', '13347407000119'),
('Hospital Municipal Adão Pereira Nunes', '13347407000120'),
('Hospital Universitário Prof Edgar Santos - HUPES', '15180714000104'),
('Hospital Ana Nery', '13347407000131'),
('Hospital Couto Maia', '13347407000142'),
('Hospital Menandro de Faria', '13347407000153'),
('Hospital Municipal Prado Valadares', '13347407000164'),
('Hospital Especializado Octavio Mangabeira', '13347407000175'),
-- UPAs
('UPA São Cristóvão', '13347407000186'),
('UPA Brotas', '13347407000197'),
('UPA Periperi', '13347407000208'),
('UPA Paripe', '13347407000219'),
('UPA Barris', '13347407000220'),
('UPA Cajazeiras', '13347407000231'),
('UPA Fazenda Grande do Retiro', '13347407000242'),
('UPA San Martin', '13347407000253'),
-- Centros de Saúde
('Centro de Saúde Nelson Piauhy Dourado', '13347407000264'),
('Centro de Saúde Ramiro de Azevedo', '13347407000275'),
('Unidade de Saúde da Família Mata Escura', '13347407000286'),
('Centro de Saúde Virgilio de Lemos', '13347407000297'),
('Unidade de Saúde da Família Fazenda Coutos', '13347407000308'),
('Centro de Saúde Federação', '13347407000319'),
('Unidade de Saúde da Família Castelo Branco', '13347407000320'),
('Centro de Saúde Liberdade', '13347407000331'),
('Unidade de Saúde da Família Pero Vaz', '13347407000342'),
('Centro de Saúde São Cristóvão', '13347407000353'),
('Unidade de Saúde da Família Cabula VI', '13347407000364'),
('Centro de Saúde Itapuã', '13347407000375');

-- Endereços das unidades
INSERT INTO hospital_endereco (hospital_id, endereco_cep, endereco_bairro, endereco_logradouro, endereco_complemento, endereco_numero) VALUES 
(1, '40320570', 'Cabula', 'Rua do Saboeiro', 'Cabula VI', '1'),
(2, '40255240', 'Cabula', 'Estrada do Saboeiro', 'Hospital do Subúrbio', 's/n'),
(3, '40301145', 'Cajazeiras', 'Estrada do Coco', 'Cajazeiras V', 's/n'),
(4, '40110909', 'Canela', 'Rua Augusto Viana', 'Canela', 's/n'),
(5, '40295001', 'Acupe de Brotas', 'Rua Waldemar Falcão', 'Brotas', '109'),
(6, '40320240', 'São Gonçalo', 'Rua Nestor Duarte', 'Couto Maia', '320'),
(7, '40301110', 'Tancredo Neves', 'Av Paralela', 'CAB', '4700'),
(8, '40301175', 'Cajazeiras', 'Rua Silveira Martins', 'Prado Valadares', '2214'),
(9, '40301110', 'Tancredo Neves', 'Av Jorge Amado', 'Imbuí', '1455'),
(10, '40223001', 'São Cristóvão', 'Rua São Cristóvão', 'São Cristóvão', '1'),
(11, '40285001', 'Brotas', 'Ladeira do Pepino', 'Brotas', '1'),
(12, '40725001', 'Periperi', 'Rua Direta do Periperi', 'Periperi', '230'),
(13, '40725110', 'Paripe', 'Rua Paripe', 'Paripe', '120'),
(14, '40070110', 'Barris', 'Rua General Labatut', 'Barris', '315'),
(15, '40301145', 'Cajazeiras', 'Estrada do Coco', 'Cajazeiras XI', '2300'),
(16, '40325032', 'Fazenda Grande do Retiro', 'Rua Direta de Águas Claras', 'Águas Claras', '1'),
(17, '40520110', 'San Martin', 'Rua San Martin', 'San Martin', '245'),
(18, '40070110', 'Centro', 'Rua Carlos Gomes', 'Centro Histórico', '1416'),
(19, '40070110', 'Centro', 'Rua do Rosário', 'Centro', '128'),
(20, '40253001', 'Mata Escura', 'Rua da Mata Escura', 'Mata Escura', '45'),
(21, '40110140', 'Nazaré', 'Largo do Nazaré', 'Nazaré', '1'),
(22, '40322001', 'Fazenda Coutos', 'Estrada Velha do Aeroporto', 'Fazenda Coutos', 'km 5'),
(23, '40210340', 'Federação', 'Rua Caetano Moura', 'Federação', '132'),
(24, '40301030', 'Castelo Branco', 'Rua Silveira Martins', 'Castelo Branco', '1200'),
(25, '40070001', 'Liberdade', 'Estrada da Liberdade', 'Liberdade', '1245'),
(26, '40725001', 'Pero Vaz', 'Rua Pero Vaz', 'Pero Vaz', '67'),
(27, '40223001', 'São Cristóvão', 'Rua São Cristóvão', 'São Cristóvão', '890'),
(28, '40255240', 'Cabula', 'Estrada do Saboeiro', 'Cabula VI', '234'),
(29, '41603001', 'Itapuã', 'Rua Itapuã', 'Itapuã', '156');


-- Atualizar coordenadas para os hospitais existentes
UPDATE HOSPITAL_ENDERECO
SET 
    HOSPITAL_LATITUDE = CASE HOSPITAL_ID
        WHEN 1 THEN -12.9476
        WHEN 2 THEN -12.9423
        WHEN 3 THEN -12.9234
        WHEN 4 THEN -13.0012
        WHEN 5 THEN -12.9876
        WHEN 6 THEN -12.9534
        WHEN 7 THEN -12.9645
        WHEN 8 THEN -12.9156
        WHEN 9 THEN -12.9712
        WHEN 10 THEN -12.9345
        WHEN 11 THEN -12.9912
        WHEN 12 THEN -12.8934
        WHEN 13 THEN -12.8812
        WHEN 14 THEN -13.0045
        WHEN 15 THEN -12.9189
        WHEN 16 THEN -12.9567
        WHEN 17 THEN -12.9823
        WHEN 18 THEN -12.9734
        WHEN 19 THEN -12.9756
        WHEN 20 THEN -12.9512
        WHEN 21 THEN -12.9823
        WHEN 22 THEN -12.9134
        WHEN 23 THEN -12.9934
        WHEN 24 THEN -12.9278
        WHEN 25 THEN -12.9645
        WHEN 26 THEN -12.8923
        WHEN 27 THEN -12.9356
        WHEN 28 THEN -12.9445
        WHEN 29 THEN -12.9234
    END,
    HOSPITAL_LONGITUDE = CASE HOSPITAL_ID
        WHEN 1 THEN -38.4685
        WHEN 2 THEN -38.4612
        WHEN 3 THEN -38.5123
        WHEN 4 THEN -38.5134
        WHEN 5 THEN -38.5087
        WHEN 6 THEN -38.4523
        WHEN 7 THEN -38.4512
        WHEN 8 THEN -38.5234
        WHEN 9 THEN -38.4678
        WHEN 10 THEN -38.4789
        WHEN 11 THEN -38.5023
        WHEN 12 THEN -38.4234
        WHEN 13 THEN -38.4123
        WHEN 14 THEN -38.5156
        WHEN 15 THEN -38.5267
        WHEN 16 THEN -38.4934
        WHEN 17 THEN -38.4867
        WHEN 18 THEN -38.5123
        WHEN 19 THEN -38.5134
        WHEN 20 THEN -38.4723
        WHEN 21 THEN -38.5089
        WHEN 22 THEN -38.4312
        WHEN 23 THEN -38.5012
        WHEN 24 THEN -38.5189
        WHEN 25 THEN -38.5234
        WHEN 26 THEN -38.4289
        WHEN 27 THEN -38.4801
        WHEN 28 THEN -38.4698
        WHEN 29 THEN -38.3678
    END
WHERE
    HOSPITAL_ID IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29);

-- Contatos das unidades
INSERT INTO hospital_contato (hospital_id, hospital_telefone, hospital_email) VALUES 
(1, '7132766400', 'hgrs@saude.ba.gov.br'),
(2, '7132815151', 'hospitalsuburbio@saude.ba.gov.br'),
(3, '7132781200', 'hmapn@saude.salvador.ba.gov.br'),
(4, '7132837000', 'hupes@ufba.br'),
(5, '7132837100', 'hana@saude.ba.gov.br'),
(6, '7133914400', 'hcm@saude.ba.gov.br'),
(7, '7133901200', 'hmenandro@saude.ba.gov.br'),
(8, '7133901300', 'hpv@saude.ba.gov.br'),
(9, '7133901400', 'heom@saude.ba.gov.br'),
(10, '7133391500', 'upa.saocristovao@saude.salvador.ba.gov.br'),
(11, '7133391600', 'upa.brotas@saude.salvador.ba.gov.br'),
(12, '7133391700', 'upa.periperi@saude.salvador.ba.gov.br'),
(13, '7133391800', 'upa.paripe@saude.salvador.ba.gov.br'),
(14, '7133391900', 'upa.barris@saude.salvador.ba.gov.br'),
(15, '7133392000', 'upa.cajazeiras@saude.salvador.ba.gov.br'),
(16, '7133392100', 'upa.retiro@saude.salvador.ba.gov.br'),
(17, '7133392200', 'upa.sanmartin@saude.salvador.ba.gov.br'),
(18, '7133265500', 'cs.piauhy@saude.salvador.ba.gov.br'),
(19, '7133265600', 'cs.ramiro@saude.salvador.ba.gov.br'),
(20, '7133265700', 'usf.mataescura@saude.salvador.ba.gov.br'),
(21, '7133265800', 'cs.virgilio@saude.salvador.ba.gov.br'),
(22, '7133265900', 'usf.coutos@saude.salvador.ba.gov.br'),
(23, '7133266000', 'cs.federacao@saude.salvador.ba.gov.br'),
(24, '7133266100', 'usf.castelo@saude.salvador.ba.gov.br'),
(25, '7133266200', 'cs.liberdade@saude.salvador.ba.gov.br'),
(26, '7133266300', 'usf.perovaz@saude.salvador.ba.gov.br'),
(27, '7133266400', 'cs.saocristovao@saude.salvador.ba.gov.br'),
(28, '7133266500', 'usf.cabulavi@saude.salvador.ba.gov.br'),
(29, '7133266600', 'cs.itapua@saude.salvador.ba.gov.br');

-- Especialidades médicas
INSERT INTO ESPECIALIDADE (ESPECIALIDADE_NOME) VALUES 
('Anestesiologia'), ('Cardiologia'), ('Cirurgia Geral'), ('Cirurgia Plástica'),
('Clínica Médica'), ('Dermatologia'), ('Emergência'), ('Endocrinologia'),
('Gastroenterologia'), ('Geriatria'), ('Ginecologia e Obstetrícia'), ('Hematologia'),
('Hepatologia'), ('Infectologia'), ('Medicina de Família e Comunidade'), ('Nefrologia'),
('Neonatologia'), ('Neurocirurgia'), ('Neurologia'), ('Oftalmologia'),
('Oncologia'), ('Ortopedia'), ('Otorrinolaringologia'), ('Pediatria'),
('Pneumologia'), ('Psicologia'), ('Psiquiatria'), ('Reumatologia'),
('Traumatologia'), ('Urologia');

-- Relacionamento Hospital-Especialidade
INSERT INTO HOSPITAL_ESPECIALIDADE (HOSPITAL_ID, ESPECIALIDADE_ID) VALUES
-- Hospital Geral Roberto Santos (1) - Grande porte
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Geral')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ortopedia')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Neurologia')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Psiquiatria')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Urologia')),
(1, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Oftalmologia')),

-- Hospital do Subúrbio (2) - Referência
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Geral')),
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ortopedia')),
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Neurologia')),
(2, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Anestesiologia')),

-- Hospital Adão Pereira Nunes (3) - Municipal
(3, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(3, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(3, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(3, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Geral')),
(3, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ortopedia')),
(3, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),

-- HUPES (4) - Universitário alta complexidade
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Geral')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Neurologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Neurocirurgia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ortopedia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Urologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Oncologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Hematologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Nefrologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Gastroenterologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Endocrinologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Reumatologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Psiquiatria')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Oftalmologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Otorrinolaringologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Dermatologia')),
(4, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Anestesiologia')),

-- Hospital Ana Nery (5) - Materno-infantil
(5, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(5, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(5, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Neonatologia')),
(5, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(5, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Geral')),
(5, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Anestesiologia')),

-- Hospital Couto Maia (6) - Infectocontagiosas
(6, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Infectologia')),
(6, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(6, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(6, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Gastroenterologia')),
(6, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Hepatologia')),
(6, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pneumologia')),

-- Hospital Menandro de Faria (7)
(7, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(7, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Geral')),
(7, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ortopedia')),
(7, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(7, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Neurologia')),
(7, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Anestesiologia')),

-- Hospital Prado Valadares (8)
(8, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(8, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(8, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(8, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Geral')),
(8, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ortopedia')),

-- Hospital Octavio Mangabeira (9) - Trauma
(9, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ortopedia')),
(9, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Traumatologia')),
(9, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Geral')),
(9, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Neurocirurgia')),
(9, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cirurgia Plástica')),
(9, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Anestesiologia')),
(9, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),

-- UPAs (10-17) - Pronto atendimento
(10, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(10, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(10, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(11, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(11, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(11, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(12, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(12, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(12, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(13, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(13, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(13, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(14, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(14, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(14, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(15, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(15, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(15, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(16, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(16, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(16, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(17, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Emergência')),
(17, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(17, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),

-- Centros de Saúde - Atenção básica (18-29)
(18, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(18, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(18, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(18, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(18, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Endocrinologia')),
(19, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(19, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(19, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(19, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(20, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Medicina de Família e Comunidade')),
(20, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(20, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(20, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(21, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(21, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(21, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(21, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(21, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Endocrinologia')),
(21, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Geriatria')),
(22, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Medicina de Família e Comunidade')),
(22, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(22, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(22, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(23, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(23, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(23, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(23, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(23, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Dermatologia')),
(24, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Medicina de Família e Comunidade')),
(24, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(24, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(24, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(25, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(25, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(25, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(25, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Psicologia')),
(26, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Medicina de Família e Comunidade')),
(26, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(26, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(26, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(27, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(27, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(27, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(27, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(28, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Medicina de Família e Comunidade')),
(28, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(28, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(28, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(29, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Clínica Médica')),
(29, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Pediatria')),
(29, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Ginecologia e Obstetrícia')),
(29, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Cardiologia')),
(29, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Dermatologia')),
(29, (SELECT ESPECIALIDADE_ID FROM ESPECIALIDADE WHERE ESPECIALIDADE_NOME = 'Oftalmologia'));

-- Dados de avaliações de exemplo (usar UUIDs reais de clientes existentes)
INSERT INTO avaliacao_hospital (hospital_id, cliente_id, avaliacao_lotacao, avaliacao_tempo_espera, avaliacao_atendimento, avaliacao_infraestrutura, avaliacao_data) VALUES
-- Hospital Geral Roberto Santos (1)
(1, 'placeholder_cliente_id', 1, 1, 2, 2, '2024-12-15 08:30:00+00'),
(1, 'placeholder_cliente_id', 2, 1, 2, 3, '2024-12-14 14:22:00+00'),
(1, 'placeholder_cliente_id', 1, 2, 1, 2, '2024-12-13 10:45:00+00'),
(1, 'placeholder_cliente_id', 3, 2, 3, 3, '2024-12-12 16:18:00+00'),
(1, 'placeholder_cliente_id', 2, 1, 2, 2, '2024-12-11 09:12:00+00'),
-- Hospital do Subúrbio (2)
(2, 'placeholder_cliente_id', 3, 3, 4, 4, '2024-12-15 11:20:00+00'),
(2, 'placeholder_cliente_id', 4, 3, 4, 3, '2024-12-14 13:45:00+00'),
(2, 'placeholder_cliente_id', 2, 2, 3, 3, '2024-12-13 15:30:00+00'),
(2, 'placeholder_cliente_id', 3, 4, 3, 4, '2024-12-12 08:55:00+00'),
(2, 'placeholder_cliente_id', 4, 3, 4, 4, '2024-12-11 17:40:00+00'),
-- Hospital Adão Pereira Nunes (3)
(3, 'placeholder_cliente_id', 2, 2, 3, 2, '2024-12-15 07:15:00+00'),
(3, 'placeholder_cliente_id', 1, 1, 2, 1, '2024-12-14 12:30:00+00'),
(3, 'placeholder_cliente_id', 3, 2, 3, 3, '2024-12-13 18:45:00+00'),
(3, 'placeholder_cliente_id', 2, 3, 2, 2, '2024-12-12 10:20:00+00'),
(3, 'placeholder_cliente_id', 1, 1, 1, 2, '2024-12-11 14:55:00+00'),
-- HUPES (4)
(4, 'placeholder_cliente_id', 4, 4, 4, 4, '2024-12-15 06:40:00+00'),
(4, 'placeholder_cliente_id', 5, 5, 5, 4, '2024-12-14 11:15:00+00'),
(4, 'placeholder_cliente_id', 3, 3, 4, 3, '2024-12-13 16:30:00+00'),
(4, 'placeholder_cliente_id', 4, 4, 4, 5, '2024-12-12 09:45:00+00'),
(4, 'placeholder_cliente_id', 5, 4, 5, 4, '2024-12-11 13:20:00+00'),
-- Hospital Ana Nery (5)
(5, 'placeholder_cliente_id', 2, 2, 3, 3, '2024-12-15 09:25:00+00'),
(5, 'placeholder_cliente_id', 3, 3, 3, 2, '2024-12-14 14:10:00+00'),
(5, 'placeholder_cliente_id', 1, 1, 2, 2, '2024-12-13 11:50:00+00'),
(5, 'placeholder_cliente_id', 2, 2, 2, 3, '2024-12-12 15:35:00+00'),
(5, 'placeholder_cliente_id', 3, 2, 3, 2, '2024-12-11 08:15:00+00'),
-- Hospital Couto Maia (6)
(6, 'placeholder_cliente_id', 3, 3, 4, 3, '2024-12-15 12:45:00+00'),
(6, 'placeholder_cliente_id', 4, 4, 4, 4, '2024-12-14 16:20:00+00'),
(6, 'placeholder_cliente_id', 2, 2, 3, 2, '2024-12-13 07:35:00+00'),
(6, 'placeholder_cliente_id', 3, 3, 3, 3, '2024-12-12 13:10:00+00'),
(6, 'placeholder_cliente_id', 4, 3, 4, 4, '2024-12-11 17:55:00+00'),
-- Hospital Menandro de Faria (7)
(7, 'placeholder_cliente_id', 2, 2, 3, 3, '2024-12-15 10:30:00+00'),
(7, 'placeholder_cliente_id', 3, 3, 3, 2, '2024-12-14 15:45:00+00'),
(7, 'placeholder_cliente_id', 1, 2, 2, 2, '2024-12-13 12:15:00+00'),
(7, 'placeholder_cliente_id', 2, 2, 3, 3, '2024-12-12 18:20:00+00'),
(7, 'placeholder_cliente_id', 3, 2, 3, 3, '2024-12-11 09:40:00+00'),
-- Hospital Prado Valadares (8)
(8, 'placeholder_cliente_id', 2, 2, 2, 2, '2024-12-15 13:25:00+00'),
(8, 'placeholder_cliente_id', 1, 1, 2, 1, '2024-12-14 17:10:00+00'),
(8, 'placeholder_cliente_id', 3, 2, 3, 3, '2024-12-13 08:45:00+00'),
(8, 'placeholder_cliente_id', 2, 2, 2, 2, '2024-12-12 14:30:00+00'),
(8, 'placeholder_cliente_id', 1, 1, 1, 2, '2024-12-11 11:15:00+00'),
-- Hospital Octavio Mangabeira (9)
(9, 'placeholder_cliente_id', 3, 3, 4, 4, '2024-12-15 14:50:00+00'),
(9, 'placeholder_cliente_id', 4, 4, 4, 4, '2024-12-14 10:35:00+00'),
(9, 'placeholder_cliente_id', 2, 2, 3, 3, '2024-12-13 16:20:00+00'),
(9, 'placeholder_cliente_id', 3, 3, 3, 4, '2024-12-12 12:05:00+00'),
(9, 'placeholder_cliente_id', 4, 3, 4, 3, '2024-12-11 15:40:00+00'),
-- UPAs (10-17)
(10, 'placeholder_cliente_id', 3, 4, 3, 3, '2024-12-15 16:15:00+00'),
(10, 'placeholder_cliente_id', 2, 3, 3, 3, '2024-12-14 09:30:00+00'),
(11, 'placeholder_cliente_id', 3, 3, 4, 4, '2024-12-15 11:40:00+00'),
(11, 'placeholder_cliente_id', 4, 4, 4, 3, '2024-12-14 15:25:00+00'),
(12, 'placeholder_cliente_id', 2, 3, 3, 3, '2024-12-15 12:20:00+00'),
(12, 'placeholder_cliente_id', 3, 3, 3, 3, '2024-12-14 16:45:00+00'),
(13, 'placeholder_cliente_id', 2, 2, 3, 3, '2024-12-15 13:35:00+00'),
(13, 'placeholder_cliente_id', 1, 2, 2, 2, '2024-12-14 17:50:00+00'),
(14, 'placeholder_cliente_id', 3, 3, 4, 4, '2024-12-15 14:10:00+00'),
(14, 'placeholder_cliente_id', 4, 4, 4, 4, '2024-12-14 18:30:00+00'),
(15, 'placeholder_cliente_id', 2, 3, 2, 3, '2024-12-15 15:25:00+00'),
(15, 'placeholder_cliente_id', 1, 2, 2, 2, '2024-12-14 19:40:00+00'),
(16, 'placeholder_cliente_id', 2, 2, 3, 3, '2024-12-15 16:00:00+00'),
(16, 'placeholder_cliente_id', 1, 1, 2, 2, '2024-12-14 20:15:00+00'),
(17, 'placeholder_cliente_id', 3, 3, 3, 4, '2024-12-15 17:10:00+00'),
(17, 'placeholder_cliente_id', 2, 2, 3, 3, '2024-12-14 21:25:00+00'),
-- Centros de Saúde (18-29)
(18, 'placeholder_cliente_id', 4, 3, 4, 3, '2024-12-15 08:20:00+00'),
(18, 'placeholder_cliente_id', 3, 2, 3, 3, '2024-12-14 10:35:00+00'),
(19, 'placeholder_cliente_id', 3, 3, 4, 3, '2024-12-15 09:30:00+00'),
(19, 'placeholder_cliente_id', 4, 3, 4, 4, '2024-12-14 11:45:00+00'),
(20, 'placeholder_cliente_id', 3, 2, 4, 3, '2024-12-15 10:40:00+00'),
(20, 'placeholder_cliente_id', 4, 3, 4, 3, '2024-12-14 12:55:00+00'),
(21, 'placeholder_cliente_id', 4, 4, 5, 4, '2024-12-15 11:50:00+00'),
(21, 'placeholder_cliente_id', 3, 3, 4, 3, '2024-12-14 14:05:00+00'),
(22, 'placeholder_cliente_id', 2, 2, 3, 2, '2024-12-15 13:00:00+00'),
(22, 'placeholder_cliente_id', 3, 3, 3, 3, '2024-12-14 15:15:00+00'),
(23, 'placeholder_cliente_id', 4, 3, 4, 4, '2024-12-15 14:10:00+00'),
(23, 'placeholder_cliente_id', 3, 3, 4, 3, '2024-12-14 16:25:00+00'),
(24, 'placeholder_cliente_id', 3, 2, 3, 3, '2024-12-15 15:20:00+00'),
(24, 'placeholder_cliente_id', 2, 2, 3, 2, '2024-12-14 17:35:00+00'),
(25, 'placeholder_cliente_id', 2, 2, 3, 2, '2024-12-15 16:30:00+00'),
(25, 'placeholder_cliente_id', 1, 1, 2, 2, '2024-12-14 18:45:00+00'),
(26, 'placeholder_cliente_id', 3, 3, 4, 3, '2024-12-15 17:40:00+00'),
(26, 'placeholder_cliente_id', 4, 3, 4, 4, '2024-12-14 19:55:00+00'),
(27, 'placeholder_cliente_id', 3, 3, 3, 3, '2024-12-15 18:50:00+00'),
(27, 'placeholder_cliente_id', 2, 2, 3, 2, '2024-12-14 21:05:00+00'),
(28, 'placeholder_cliente_id', 3, 2, 4, 3, '2024-12-15 20:00:00+00'),
(28, 'placeholder_cliente_id', 4, 3, 4, 3, '2024-12-14 22:15:00+00'),
(29, 'placeholder_cliente_id', 4, 4, 4, 4, '2024-12-15 21:10:00+00'),
(29, 'placeholder_cliente_id', 5, 4, 5, 4, '2024-12-14 23:25:00+00');