import { Client } from '@googlemaps/google-maps-services-js';
import dotenv from 'dotenv';

dotenv.config();

class RoutingService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY não está definida no arquivo .env');
    }
  }

  /**
   * Cria rota entre dois ou mais pontos
   * @param {string|Object} origin - Endereço origem ou {lat, lng}
   * @param {string|Object} destination - Endereço destino ou {lat, lng}
   * @param {Object} options - Opções da rota
   * @returns {Promise<Object>} Dados da rota
   */
  async createRoute(origin, destination, options = {}) {
    const {
      mode = 'driving', // driving, walking, transit, bicycling
      language = 'pt-BR',
      region = 'br',
      avoid = [], // tolls, highways, ferries, indoor
      waypoints = [], // pontos intermediários
      optimize_waypoints = false,
      departure_time = null, // timestamp para trânsito
      arrival_time = null,
      traffic_model = 'best_guess', // best_guess, pessimistic, optimistic
      transit_mode = [], // bus, subway, train, tram, rail
      units = 'metric',
      alternatives = false, // buscar rotas alternativas
      timeout = 10000
    } = options;

    try {
      const params = {
        origin: this.formatLocation(origin),
        destination: this.formatLocation(destination),
        mode,
        language,
        region,
        units,
        key: this.apiKey
      };

      // Adiciona waypoints se especificados
      if (waypoints.length > 0) {
        params.waypoints = waypoints.map(wp => ({
          location: this.formatLocation(wp.location),
          stopover: wp.stopover !== false // default true
        }));
        params.optimize = optimize_waypoints;
      }

      // Configurações de trânsito
      if (mode === 'transit') {
        if (departure_time) params.departure_time = departure_time;
        if (arrival_time) params.arrival_time = arrival_time;
        if (transit_mode.length > 0) params.transit_mode = transit_mode;
      }

      // Configurações de tráfego para driving
      if (mode === 'driving') {
        if (departure_time) {
          params.departure_time = departure_time;
          params.traffic_model = traffic_model;
        }
      }

      // Evitar certas condições
      if (avoid.length > 0) {
        params.avoid = avoid;
      }

      // Rotas alternativas
      if (alternatives) {
        params.alternatives = true;
      }

      const response = await this.client.directions({
        params,
        timeout
      });

      if (response.data.status === 'OK') {
        return this.processRouteResponse(response.data);
      } else {
        throw new Error(`Erro na API: ${response.data.status} - ${response.data.error_message || 'Erro desconhecido'}`);
      }

    } catch (error) {
      console.error('Erro ao criar rota:', error.message);
      throw new Error(`Não foi possível criar a rota: ${error.message}`);
    }
  }

  /**
   * Cria múltiplas rotas com diferentes opções
   * @param {string|Object} origin - Origem
   * @param {string|Object} destination - Destino
   * @param {Array} modes - Array de modos de transporte
   * @returns {Promise<Object>} Comparação das rotas
   */
  async compareRoutes(origin, destination, modes = ['driving', 'walking', 'transit']) {
    const results = {};
    
    for (const mode of modes) {
      try {
        const route = await this.createRoute(origin, destination, { 
          mode,
          alternatives: false
        });
        results[mode] = route;
        
        // Delay para evitar rate limit
        await this.sleep(200);
        
      } catch (error) {
        results[mode] = { error: error.message };
      }
    }
    
    return {
      origin_formatted: typeof origin === 'string' ? origin : `${origin.lat}, ${origin.lng}`,
      destination_formatted: typeof destination === 'string' ? destination : `${destination.lat}, ${destination.lng}`,
      routes: results,
      summary: this.createRouteSummary(results)
    };
  }

  /**
   * Cria rota com múltiplas paradas (road trip)
   * @param {Array} locations - Array de localizações em ordem
   * @param {Object} options - Opções da rota
   * @returns {Promise<Object>} Rota completa
   */
  async createMultiStopRoute(locations, options = {}) {
    if (locations.length < 2) {
      throw new Error('É necessário pelo menos 2 localizações');
    }

    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1).map(location => ({
      location,
      stopover: true
    }));

    return await this.createRoute(origin, destination, {
      ...options,
      waypoints,
      optimize_waypoints: options.optimize_waypoints || false
    });
  }

  /**
   * Busca rota otimizada (caixeiro viajante)
   * @param {string|Object} start - Ponto de partida
   * @param {Array} destinations - Destinos a visitar
   * @param {string|Object} end - Ponto final (opcional, se não especificado volta ao start)
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Rota otimizada
   */
  async createOptimizedRoute(start, destinations, end = null, options = {}) {
    const waypoints = destinations.map(dest => ({
      location: dest,
      stopover: true
    }));

    return await this.createRoute(start, end || start, {
      ...options,
      waypoints,
      optimize_waypoints: true
    });
  }

  /**
   * Cria matriz de distâncias entre múltiplos pontos
   * @param {Array} origins - Array de origens
   * @param {Array} destinations - Array de destinos
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Matriz de distâncias
   */
  async createDistanceMatrix(origins, destinations, options = {}) {
    const {
      mode = 'driving',
      language = 'pt-BR',
      units = 'metric',
      avoid = [],
      departure_time = null,
      timeout = 10000
    } = options;

    try {
      const params = {
        origins: origins.map(o => this.formatLocation(o)),
        destinations: destinations.map(d => this.formatLocation(d)),
        mode,
        language,
        units,
        key: this.apiKey
      };

      if (avoid.length > 0) params.avoid = avoid;
      if (departure_time && mode === 'driving') {
        params.departure_time = departure_time;
      }

      const response = await this.client.distancematrix({
        params,
        timeout
      });

      if (response.data.status === 'OK') {
        return this.processDistanceMatrixResponse(response.data, origins, destinations);
      } else {
        throw new Error(`Erro na API: ${response.data.status}`);
      }

    } catch (error) {
      console.error('Erro ao criar matriz de distâncias:', error.message);
      throw new Error(`Não foi possível criar a matriz: ${error.message}`);
    }
  }

  /**
   * Processa a resposta da API de rotas
   */
  processRouteResponse(data) {
    const routes = data.routes.map(route => {
      const leg = route.legs[0];
      
      return {
        summary: route.summary,
        distance: {
          text: leg.distance.text,
          value: leg.distance.value // metros
        },
        duration: {
          text: leg.duration.text,
          value: leg.duration.value // segundos
        },
        duration_in_traffic: leg.duration_in_traffic ? {
          text: leg.duration_in_traffic.text,
          value: leg.duration_in_traffic.value
        } : null,
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML
          distance: step.distance.text,
          duration: step.duration.text,
          start_location: step.start_location,
          end_location: step.end_location,
          maneuver: step.maneuver || null
        })),
        overview_polyline: route.overview_polyline.points,
        warnings: route.warnings || [],
        waypoint_order: route.waypoint_order || []
      };
    });

    return {
      status: data.status,
      routes: routes,
      best_route: routes[0], // Primeira rota é geralmente a melhor
      geocoded_waypoints: data.geocoded_waypoints
    };
  }

  /**
   * Processa resposta da matriz de distâncias
   */
  processDistanceMatrixResponse(data, origins, destinations) {
    const matrix = [];
    
    data.rows.forEach((row, originIndex) => {
      const originData = {
        origin: origins[originIndex],
        origin_formatted: data.origin_addresses[originIndex],
        destinations: []
      };
      
      row.elements.forEach((element, destIndex) => {
        if (element.status === 'OK') {
          originData.destinations.push({
            destination: destinations[destIndex],
            destination_formatted: data.destination_addresses[destIndex],
            distance: element.distance,
            duration: element.duration,
            duration_in_traffic: element.duration_in_traffic || null
          });
        } else {
          originData.destinations.push({
            destination: destinations[destIndex],
            error: element.status
          });
        }
      });
      
      matrix.push(originData);
    });
    
    return {
      status: data.status,
      matrix: matrix,
      origin_addresses: data.origin_addresses,
      destination_addresses: data.destination_addresses
    };
  }

  /**
   * Cria resumo comparativo das rotas
   */
  createRouteSummary(results) {
    const summary = {};
    
    Object.keys(results).forEach(mode => {
      const route = results[mode];
      if (!route.error && route.best_route) {
        summary[mode] = {
          distance_km: (route.best_route.distance.value / 1000).toFixed(2),
          duration_minutes: Math.round(route.best_route.duration.value / 60),
          duration_formatted: route.best_route.duration.text
        };
      }
    });
    
    return summary;
  }

  /**
   * Formata localização para a API
   */
  formatLocation(location) {
    if (typeof location === 'string') {
      return location;
    }
    if (location.lat !== undefined && location.lng !== undefined) {
      return `${location.lat},${location.lng}`;
    }
    throw new Error('Formato de localização inválido');
  }

  /**
   * Delay entre requisições
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Converte polyline em coordenadas (para mapas)
   */
  decodePolyline(polyline) {
    // Implementação básica de decodificação de polyline
    // Para uso completo, use uma biblioteca como @googlemaps/polyline-codec
    const points = [];
    let index = 0, len = polyline.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ lat: lat / 1E5, lng: lng / 1E5 });
    }

    return points;
  }
}


// Instância singleton
const routingService = new RoutingService();

// Funções de conveniência
export async function createRoute(origin, destination, options) {
  return await routingService.createRoute(origin, destination, options);
}

export async function compareRoutes(origin, destination, modes) {
  return await routingService.compareRoutes(origin, destination, modes);
}

export async function createMultiStopRoute(locations, options) {
  return await routingService.createMultiStopRoute(locations, options);
}

export async function createOptimizedRoute(start, destinations, end, options) {
  return await routingService.createOptimizedRoute(start, destinations, end, options);
}

export async function createDistanceMatrix(origins, destinations, options) {
  return await routingService.createDistanceMatrix(origins, destinations, options);
}

export { RoutingService };
export default routingService;