// ===== BACKEND (routes/maps.js) =====
import express from 'express';
import axios from 'axios';

const router = express.Router();


const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Endpoint para calcular distância entre dois pontos
router.post('/calcular-distancia', async (req, res) => {
    try {
        const { origem, destino } = req.body;

        if (!origem || !destino) {
            return res.status(400).json({
                erro: 'Origem e destino são obrigatórios'
            });
        }

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
        
        const response = await axios.get(url, {
            params: {
                origins: `${origem.lat},${origem.lng}`,
                destinations: `${destino.lat},${destino.lng}`,
                key: GOOGLE_MAPS_API_KEY,
                mode: 'driving',
                language: 'pt-BR'
            }
        });

        if (response.data.status !== 'OK') {
            return res.status(400).json({
                erro: 'Erro ao calcular distância',
                detalhes: response.data.status
            });
        }

        const elemento = response.data.rows[0].elements[0];

        if (elemento.status === 'ZERO_RESULTS') {
            return res.status(404).json({
                erro: 'Rota não encontrada'
            });
        }

        res.json({
            distancia: {
                texto: elemento.distance.text,
                metros: elemento.distance.value
            },
            duracao: {
                texto: elemento.duration.text,
                segundos: elemento.duration.value
            }
        });

    } catch (erro) {
        console.error('Erro na API de distância:', erro);
        res.status(500).json({
            erro: 'Erro ao calcular distância'
        });
    }
});

// Endpoint para obter rota detalhada
router.post('/obter-rota', async (req, res) => {
    try {
        const { origem, destino } = req.body;

        if (!origem || !destino) {
            return res.status(400).json({
                erro: 'Origem e destino são obrigatórios'
            });
        }

        const url = `https://maps.googleapis.com/maps/api/directions/json`;
        
        const response = await axios.get(url, {
            params: {
                origin: `${origem.lat},${origem.lng}`,
                destination: `${destino.lat},${destino.lng}`,
                key: GOOGLE_MAPS_API_KEY,
                mode: 'driving',
                language: 'pt-BR'
            }
        });

        if (response.data.status !== 'OK') {
            return res.status(400).json({
                erro: 'Erro ao obter rota',
                detalhes: response.data.status
            });
        }

        const rota = response.data.routes[0];
        const perna = rota.legs[0];

        res.json({
            sucesso: true,
            rota: {
                distancia: {
                    texto: perna.distance.text,
                    metros: perna.distance.value
                },
                duracao: {
                    texto: perna.duration.text,
                    segundos: perna.duration.value
                },
                polyline: rota.overview_polyline.points,
                enderecoSaida: perna.start_address,
                enderecoChegada: perna.end_address,
                passos: perna.steps.map(passo => ({
                    instrucao: passo.html_instructions,
                    distancia: passo.distance.text,
                    duracao: passo.duration.text
                }))
            }
        });

    } catch (erro) {
        console.error('Erro na API de rota:', erro);
        res.status(500).json({
            erro: 'Erro ao obter rota'
        });
    }
});

// Endpoint para geocodificar endereço e obter coordenadas
router.post('/geocodificar', async (req, res) => {
    try {
        const { endereco } = req.body;

        if (!endereco) {
            return res.status(400).json({
                erro: 'Endereço é obrigatório'
            });
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json`;
        
        const response = await axios.get(url, {
            params: {
                address: endereco,
                key: GOOGLE_MAPS_API_KEY,
                language: 'pt-BR'
            }
        });

        if (response.data.status !== 'OK' || response.data.results.length === 0) {
            return res.status(404).json({
                erro: 'Endereço não encontrado'
            });
        }

        const resultado = response.data.results[0];

        res.json({
            sucesso: true,
            coordenadas: {
                lat: resultado.geometry.location.lat,
                lng: resultado.geometry.location.lng
            },
            endereco_formatado: resultado.formatted_address
        });

    } catch (erro) {
        console.error('Erro na geocodificação:', erro);
        res.status(500).json({
            erro: 'Erro ao geocodificar endereço'
        });
    }
});




// ===== FRONTEND (arquivo global.js ou adicionar isto) =====

class GoogleMapsAPI {
    constructor() {
        this.baseURL = '/api/maps';
    }

    async calcularDistancia(origem, destino) {
        try {
            const response = await fetch(`${this.baseURL}/calcular-distancia`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ origem, destino })
            });

            if (!response.ok) {
                throw new Error('Erro ao calcular distância');
            }

            return await response.json();
        } catch (erro) {
            console.error('Erro:', erro);
            throw erro;
        }
    }

    async obterRota(origem, destino) {
        try {
            const response = await fetch(`${this.baseURL}/obter-rota`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ origem, destino })
            });

            if (!response.ok) {
                throw new Error('Erro ao obter rota');
            }

            return await response.json();
        } catch (erro) {
            console.error('Erro:', erro);
            throw erro;
        }
    }

    async geocodificar(endereco) {
        try {
            const response = await fetch(`${this.baseURL}/geocodificar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ endereco })
            });

            if (!response.ok) {
                throw new Error('Erro ao geocodificar');
            }

            return await response.json();
        } catch (erro) {
            console.error('Erro:', erro);
            throw erro;
        }
    }

    obterLocalizacaoAtual() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não suportada'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
}

const mapsAPI = new GoogleMapsAPI();

// Em: src/services/maps.js



// Use "export class" para que o import { GoogleMapsService } funcione
export class GoogleMapsService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://maps.googleapis.com/maps/api';
    }

    async calcularDistancia(origem, destino) {
        const url = `${this.baseURL}/distancematrix/json`;
        const response = await axios.get(url, {
            params: {
                origins: `${origem.lat},${origem.lng}`,
                destinations: `${destino.lat},${destino.lng}`,
                key: this.apiKey,
                mode: 'driving',
                language: 'pt-BR'
            }
        });
        return response.data;
    }

    async obterRota(origem, destino) {
        const url = `${this.baseURL}/directions/json`;
        const response = await axios.get(url, {
            params: {
                origin: `${origem.lat},${origem.lng}`,
                destination: `${destino.lat},${destino.lng}`,
                key: this.apiKey,
                mode: 'driving',
                language: 'pt-BR'
            }
        });
        return response.data;
    }

    async geocodificar(endereco) {
        const url = `${this.baseURL}/geocode/json`;
        const response = await axios.get(url, {
            params: {
                address: endereco,
                key: this.apiKey,
                language: 'pt-BR'
            }
        });
        return response.data;
    }
}