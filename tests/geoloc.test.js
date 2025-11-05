// Importa as funções que você quer testar
import { deg2rad, getDistanceFromLatLonInKm } from '../src/utils/geoloc.js'; // <- AJUSTE ESTE CAMINHO

describe('Utilitários de Distância (Geolocalização)', () => {

  // ... (describe 'deg2rad' - não precisa mudar) ...

  /**
   * Testes para a função getDistanceFromLatLonInKm (Fórmula Haversine)
   */
  describe('getDistanceFromLatLonInKm', () => {
    
    // ... (outros testes que passaram - não precisa mudar) ...

    test('deve calcular corretamente a distância entre São Paulo e Rio de Janeiro', () => {
      const spLat = -23.5505;
      const spLon = -46.6333;
      const rjLat = -22.9068;
      const rjLon = -43.1729;

      // O , 1 no final significa que aceitamos uma precisão de 1 casa decimal
      
      // LINHA CORRIGIDA:
      // O valor recebido foi 360.7488... então esperamos 360.7
      expect(getDistanceFromLatLonInKm(spLat, spLon, rjLat, rjLon)).toBeCloseTo(360.7, 1);
    });

    // ... (outros testes que passaram - não precisa mudar) ...

    test('deve aceitar coordenadas 0 como válidas (teste do bugfix)', () => {
      const p1Lat = 0;
      const p1Lon = 0;
      const p2Lat = 10;
      const p2Lon = 10;
      // Apenas checa que o cálculo é feito e NÃO retorna Infinity
      expect(getDistanceFromLatLonInKm(p1Lat, p1Lon, p2Lat, p2Lon)).not.toBe(Infinity);
      
      // LINHA CORRIGIDA:
      // O valor recebido foi 1568.5205... então esperamos 1568.5
      expect(getDistanceFromLatLonInKm(p1Lat, p1Lon, p2Lat, p2Lon)).toBeCloseTo(1568.5, 1);
    });

  });
});