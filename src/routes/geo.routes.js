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

export default geo;