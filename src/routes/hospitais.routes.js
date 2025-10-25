// routes/hospitais.routes.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Inicializar Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// IMPORTANTE: Rotas mais específicas DEVEM vir ANTES de rotas genéricas
// A rota /proximos deve vir ANTES de qualquer rota com parâmetros como /:id

// Rota para buscar hospitais próximos (DEVE VIR PRIMEIRO)
router.get('/proximos', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        // Validação dos parâmetros
        if (!lat || !lon) {
            return res.status(400).json({ 
                erro: 'Parâmetros lat e lon são obrigatórios' 
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        // Validação dos valores
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ 
                erro: 'Valores de latitude e longitude inválidos' 
            });
        }

        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({ 
                erro: 'Latitude deve estar entre -90 e 90' 
            });
        }

        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({ 
                erro: 'Longitude deve estar entre -180 e 180' 
            });
        }

        // Buscar todos os hospitais com suas coordenadas e avaliações
        const { data: hospitais, error } = await supabase
            .from('hospital')
            .select(`
                hospital_id,
                hospital_nome,
                hospital_endereco (*),
                avaliacao_hospital (
                    avaliacao_lotacao,
                    avaliacao_tempo_espera,
                    avaliacao_atendimento,
                    avaliacao_infraestrutura
                )
            `);

        if (error) {
            console.error('Erro ao buscar hospitais:', error);
            return res.status(500).json({ 
                erro: 'Erro ao buscar hospitais no banco de dados',
                detalhes: error.message 
            });
        }

        console.log(`Total de hospitais encontrados: ${hospitais?.length || 0}`);
        
        // Debug: Ver estrutura do primeiro hospital
        if (hospitais && hospitais.length > 0) {
            console.log('Estrutura do primeiro hospital:', JSON.stringify(hospitais[0], null, 2));
        }

        if (!hospitais || hospitais.length === 0) {
            return res.json({
                sucesso: true,
                total: 0,
                hospitais: []
            });
        }

        // Filtrar apenas hospitais com coordenadas válidas e calcular distâncias
        const hospitaisComDistancia = hospitais
            .filter(hospital => {
                // Verifica se hospital_endereco existe e é um array com elementos
                if (!hospital.hospital_endereco || !Array.isArray(hospital.hospital_endereco) || hospital.hospital_endereco.length === 0) {
                    console.log(`Hospital ${hospital.hospital_nome} sem endereço`);
                    return false;
                }

                // Pega o primeiro endereço do array
                const endereco = hospital.hospital_endereco[0];
                const lat = endereco.hospital_latitude;
                const lng = endereco.hospital_longitude;

                if (!lat || !lng || lat === 0 || lng === 0) {
                    console.log(`Hospital ${hospital.hospital_nome} sem coordenadas válidas: lat=${lat}, lng=${lng}`);
                    return false;
                }

                return true;
            })
            .map(hospital => {
                // Pega o primeiro endereço do array
                const endereco = hospital.hospital_endereco[0];
                const lat = parseFloat(endereco.hospital_latitude);
                const lng = parseFloat(endereco.hospital_longitude);

                const distanciaKm = calcularDistanciaHaversine(
                    latitude,
                    longitude,
                    lat,
                    lng
                );

                // Calcular médias das avaliações
                let mediaGeral = 0;
                let mediaTempoEspera = 0;
                let mediaInfraestrutura = 0;
                
                if (hospital.avaliacao_hospital && hospital.avaliacao_hospital.length > 0) {
                    const total = hospital.avaliacao_hospital.length;
                    
                    const somaMedias = hospital.avaliacao_hospital.reduce((acc, avaliacao) => {
                        const mediaAvaliacao = (
                            avaliacao.avaliacao_lotacao +
                            avaliacao.avaliacao_tempo_espera +
                            avaliacao.avaliacao_atendimento +
                            avaliacao.avaliacao_infraestrutura
                        ) / 4;
                        return acc + mediaAvaliacao;
                    }, 0);
                    
                    const somaTempoEspera = hospital.avaliacao_hospital.reduce((acc, av) => 
                        acc + av.avaliacao_tempo_espera, 0);
                    
                    const somaInfraestrutura = hospital.avaliacao_hospital.reduce((acc, av) => 
                        acc + av.avaliacao_infraestrutura, 0);
                    
                    mediaGeral = somaMedias / total;
                    mediaTempoEspera = somaTempoEspera / total;
                    mediaInfraestrutura = somaInfraestrutura / total;
                }

                return {
                    id: hospital.hospital_id,
                    nome: hospital.hospital_nome,
                    latitude: lat,
                    longitude: lng,
                    distancia_km: distanciaKm,
                    distancia_metros: Math.round(distanciaKm * 1000),
                    media_geral: parseFloat(mediaGeral.toFixed(1)),
                    media_tempo_espera: parseFloat(mediaTempoEspera.toFixed(1)),
                    media_infraestrutura: parseFloat(mediaInfraestrutura.toFixed(1))
                };
            });

        console.log(`Hospitais com coordenadas válidas: ${hospitaisComDistancia.length}`);

        if (hospitaisComDistancia.length > 0) {
            console.log('Exemplo do primeiro hospital:', {
                nome: hospitaisComDistancia[0].nome,
                lat: hospitaisComDistancia[0].latitude,
                lng: hospitaisComDistancia[0].longitude,
                distancia_km: hospitaisComDistancia[0].distancia_km,
                distancia_metros: hospitaisComDistancia[0].distancia_metros,
                media_geral: hospitaisComDistancia[0].media_geral
            });
        }

        // Ordena por distância
        hospitaisComDistancia.sort((a, b) => a.distancia_km - b.distancia_km);

        // Retornar apenas os 50 mais próximos
        const hospitaisProximos = hospitaisComDistancia.slice(0, 50);

        console.log(`Retornando ${hospitaisProximos.length} hospitais mais próximos`);

        res.json({
            sucesso: true,
            total: hospitaisProximos.length,
            hospitais: hospitaisProximos,
            debug: {
                total_no_banco: hospitais.length,
                com_coordenadas: hospitaisComDistancia.length,
                user_location: { latitude, longitude }
            }
        });

    } catch (erro) {
        console.error('Erro no endpoint /proximos:', erro);
        res.status(500).json({ 
            erro: 'Erro interno do servidor',
            detalhes: erro.message 
        });
    }
});

// Outras rotas dos hospitais (devem vir DEPOIS)
// Exemplo de rota para página de listagem
router.get('/', async (req, res) => {
    try {
        res.render('hospitais', {
            titulo: 'Hospitais Próximos'
        });
    } catch (erro) {
        console.error('Erro ao renderizar página de hospitais:', erro);
        res.status(500).send('Erro ao carregar página');
    }
});

// Rota para detalhes de um hospital específico
// Esta rota usa parâmetro :id e deve vir por último
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar dados do hospital
        const { data: hospital, error: hospitalError } = await supabase
            .from('hospital')
            .select(`
                hospital_id,
                hospital_nome,
                hospital_cnpj
            `)
            .eq('hospital_id', id)
            .single();

        if (hospitalError || !hospital) {
            console.error('Erro ao buscar hospital:', hospitalError);
            return res.status(404).send('Hospital não encontrado');
        }

        // Buscar endereço
        const { data: enderecos, error: enderecoError } = await supabase
            .from('hospital_endereco')
            .select('*')
            .eq('hospital_id', id);

        // Buscar contatos
        const { data: contatos, error: contatoError } = await supabase
            .from('hospital_contato')
            .select('*')
            .eq('hospital_id', id);

        // Buscar avaliações para calcular estatísticas
        const { data: avaliacoes, error: avaliacoesError } = await supabase
            .from('avaliacao_hospital')
            .select('*')
            .eq('hospital_id', id);

        // Buscar alertas de especialidades
        const { data: alertas, error: alertasError } = await supabase
            .from('vw_alertas_especialidade')
            .select('*')
            .eq('hospital_id', id);

        const enderecoData = Array.isArray(enderecos) && enderecos.length > 0
            ? enderecos[0]
            : {};

        // Calcular estatísticas
        let stats = null;
        if (avaliacoes && avaliacoes.length > 0) {
            const somaLotacao = avaliacoes.reduce((acc, av) => acc + av.avaliacao_lotacao, 0);
            const somaTempo = avaliacoes.reduce((acc, av) => acc + av.avaliacao_tempo_espera, 0);
            const somaAtendimento = avaliacoes.reduce((acc, av) => acc + av.avaliacao_atendimento, 0);
            const somaInfra = avaliacoes.reduce((acc, av) => acc + av.avaliacao_infraestrutura, 0);
            const total = avaliacoes.length;

            const mediaLotacao = somaLotacao / total;
            const mediaTempo = somaTempo / total;
            const mediaAtendimento = somaAtendimento / total;
            const mediaInfra = somaInfra / total;
            const mediaGeral = (mediaLotacao + mediaTempo + mediaAtendimento + mediaInfra) / 4;

            stats = {
                total_avaliacoes: total,
                media_lotacao: mediaLotacao,
                media_tempo: mediaTempo,
                media_atendimento: mediaAtendimento,
                media_infraestrutura: mediaInfra,
                media_geral: mediaGeral
            };
        }

        // Formatar alertas
        const alertasFormatados = alertas ? alertas.map(alerta => ({
            mensagem: `${alerta.especialidade_nome} em falta - ${alerta.total_reports_falta} relatos nas últimas 72h`
        })) : [];

        res.render('hospital', {
            hospital: {
                hospital_id: hospital.hospital_id,
                nome_hospital: hospital.hospital_nome,
                hospital_cnpj: hospital.hospital_cnpj
            },
            address: enderecoData,
            contacts: contatos || [],
            stats: stats,
            alertas: alertasFormatados,
            process: process
        });
    } catch (erro) {
        console.error('Erro ao buscar hospital:', erro);
        res.status(500).send('Erro ao carregar hospital');
    }
});

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param {number} lat1 - Latitude do ponto 1
 * @param {number} lon1 - Longitude do ponto 1
 * @param {number} lat2 - Latitude do ponto 2
 * @param {number} lon2 - Longitude do ponto 2
 * @returns {number} Distância em quilômetros
 */
function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em quilômetros
    
    const dLat = grausParaRadianos(lat2 - lat1);
    const dLon = grausParaRadianos(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(grausParaRadianos(lat1)) * 
        Math.cos(grausParaRadianos(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    
    return distancia;
    
}

/**
 * Converte graus para radianos
 * @param {number} graus 
 * @returns {number} Radianos
 */
function grausParaRadianos(graus) {
    return graus * (Math.PI / 180);
}

export default router;