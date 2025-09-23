import express from 'express';
import geolocationService from '../services/geolocation.js';

const geo = express.Router();

geo.get('/geolocate', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'O endereço é obrigatório' });
  }

  try {
    const location = await geolocationService.getGeolocation(address);
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

geo.get('/reverse-geocode', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude (lat) e Longitude (lng) são obrigatórias.' });
  }

  try {
    const address = await geolocationService.getAddressFromCoordinates(parseFloat(lat), parseFloat(lng));
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default geo;