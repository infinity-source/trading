import express from 'express';
import { 
  getCurrentPrices, 
  getHistoricalData, 
  getTechnicalIndicators,
  getMarketStatus 
} from '../controllers/marketController';

const router = express.Router();

// Rutas de datos de mercado
router.get('/prices', getCurrentPrices);
router.get('/historical', getHistoricalData);
router.get('/indicators', getTechnicalIndicators);
router.get('/status', getMarketStatus);

export default router;