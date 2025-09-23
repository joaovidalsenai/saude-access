// src/services/geolocation.js
import { Client } from '@googlemaps/google-maps-services-js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({});

async function getGeolocation(address) {
  try {
    const response = await client.geocode({
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 1000, // optional
    });

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].geometry.location;
    } else {
      throw new Error('Nenhum resultado encontrado para o endereço fornecido.');
    }
  } catch (error) {
    console.error('Erro ao buscar dados de geolocalização do Google:', error.message);
    throw new Error('Não foi possível buscar os dados de geolocalização.');
  }
}

export default { getGeolocation };