// public/js/distanceCalculator.js

/**
 * Serviço de cálculo de distâncias e rotas
 * Gerencia localização do usuário e cálculos de distância
 */
class DistanceCalculator {
    constructor() {
        this.userLocation = null;
        this.watchId = null;
    }

    /**
     * Obtém a localização atual do usuário
     * @returns {Promise<{lat: number, lng: number}>}
     */
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error('Geolocalização não é suportada por este navegador.'));
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(this.userLocation);
                },
                (error) => {
                    let errorMessage = 'Erro ao obter localização.';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Permissão de localização negada. Por favor, ative-a nas configurações do seu navegador.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Informação de localização não disponível.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Tempo esgotado ao obter localização.';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    /**
     * Calcula distância usando a fórmula de Haversine (em linha reta)
     * @param {number} lat1 - Latitude do ponto 1
     * @param {number} lng1 - Longitude do ponto 1
     * @param {number} lat2 - Latitude do ponto 2
     * @param {number} lng2 - Longitude do ponto 2
     * @returns {number} Distância em metros
     */
    calculateHaversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Raio da Terra em metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distância em metros
    }

    /**
     * Formata a distância para exibição
     * @param {number} meters - Distância em metros
     * @returns {string} Distância formatada
     */
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }
        return `${(meters / 1000).toFixed(1)} km`;
    }

    /**
     * Estima o tempo de viagem baseado na distância
     * @param {number} meters - Distância em metros
     * @param {string} mode - Modo de transporte ('driving', 'walking')
     * @returns {string} Tempo estimado formatado
     */
    estimateTravelTime(meters, mode = 'driving') {
        let speedKmh;
        switch(mode) {
            case 'walking':
                speedKmh = 5; // 5 km/h caminhando
                break;
            case 'driving':
            default:
                speedKmh = 40; // 40 km/h média urbana
                break;
        }

        const hours = (meters / 1000) / speedKmh;
        const minutes = Math.round(hours * 60);

        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
    }

    /**
     * Calcula distâncias para uma lista de hospitais usando a API do servidor
     * @param {Array} hospitais - Lista de hospitais com coordenadas
     * @returns {Promise<Array>} Lista de hospitais ordenados por distância
     */
    async calculateDistancesWithAPI(hospitais) {
        if (!this.userLocation) {
            await this.getUserLocation();
        }

        const response = await fetch(
            `/hospitais/proximos?lat=${this.userLocation.lat}&lon=${this.userLocation.lng}`
        );

        if (!response.ok) {
            throw new Error('Erro ao calcular distâncias com o servidor.');
        }

        return await response.json();
    }

    /**
     * Calcula distâncias localmente (sem API, usando Haversine)
     * @param {Array} hospitais - Lista de hospitais com coordenadas
     * @returns {Array} Lista de hospitais ordenados por distância
     */
    calculateDistancesLocally(hospitais) {
        if (!this.userLocation) {
            throw new Error('Localização do usuário não disponível.');
        }

        const hospitaisComDistancia = hospitais.map(hospital => {
            const distance = this.calculateHaversineDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                hospital.latitude,
                hospital.longitude
            );

            return {
                ...hospital,
                distancia_valor: distance,
                distancia_texto: this.formatDistance(distance),
                tempo_texto: this.estimateTravelTime(distance, 'driving')
            };
        });

        // Ordena por distância
        return hospitaisComDistancia.sort((a, b) => a.distancia_valor - b.distancia_valor);
    }

    /**
     * Calcula distância e tempo para um único hospital
     * @param {number} hospitalLat - Latitude do hospital
     * @param {number} hospitalLng - Longitude do hospital
     * @returns {Promise<Object>} Objeto com distância e tempo
     */
    async calculateSingleDistance(hospitalLat, hospitalLng) {
        if (!this.userLocation) {
            await this.getUserLocation();
        }

        const distance = this.calculateHaversineDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            hospitalLat,
            hospitalLng
        );

        return {
            distancia: {
                valor: distance,
                texto: this.formatDistance(distance)
            },
            duracao: {
                texto: this.estimateTravelTime(distance, 'driving')
            },
            origem: this.userLocation,
            destino: { lat: hospitalLat, lng: hospitalLng }
        };
    }

    /**
     * Gera URL para abrir rotas no Google Maps
     * @param {number} destLat - Latitude do destino
     * @param {number} destLng - Longitude do destino
     * @returns {string} URL do Google Maps
     */
    getGoogleMapsDirectionsURL(destLat, destLng) {
        if (this.userLocation) {
            // Com origem especificada
            return `https://www.google.com/maps/dir/${this.userLocation.lat},${this.userLocation.lng}/${destLat},${destLng}`;
        }
        // Sem origem (Google Maps detecta automaticamente)
        return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    }

    /**
     * Monitora mudanças na localização do usuário
     * @param {Function} callback - Função chamada quando a localização muda
     */
    watchLocation(callback) {
        if (!navigator.geolocation) {
            console.error('Geolocalização não suportada.');
            return;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                callback(this.userLocation);
            },
            (error) => {
                console.error('Erro ao monitorar localização:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    /**
     * Para de monitorar a localização
     */
    stopWatchingLocation() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    /**
     * Verifica se o navegador suporta geolocalização
     * @returns {boolean}
     */
    isGeolocationSupported() {
        return 'geolocation' in navigator;
    }

    /**
     * Limpa a localização armazenada
     */
    clearLocation() {
        this.userLocation = null;
        this.stopWatchingLocation();
    }
}

// Exporta uma instância única (singleton)
const distanceCalculator = new DistanceCalculator();

// Torna disponível globalmente
if (typeof window !== 'undefined') {
    window.DistanceCalculator = DistanceCalculator;
    window.distanceCalculator = distanceCalculator;
}
