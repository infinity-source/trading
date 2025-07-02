import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Importar rutas
import marketRoutes from './routes/marketRoutes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de API
app.use('/api/market', marketRoutes);

// Ruta básica de prueba
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Trading Platform Backend está funcionando!',
    timestamp: new Date().toISOString() 
  });
});

// Ruta de información
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Trading Platform Pro API',
    version: '1.0.0',
    endpoints: [
      'GET /health - Estado del servidor',
      'GET /api/info - Información de la API',
      'GET /api/market/prices - Precios actuales de todos los instrumentos',
      'GET /api/market/historical?symbol=EURUSD&timeframe=1H - Datos históricos',
      'GET /api/market/indicators?symbol=EURUSD&timeframe=1H - Indicadores técnicos',
      'GET /api/market/status - Estado del mercado'
    ]
  });
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableRoutes: [
      'GET /health',
      'GET /api/info',
      'GET /api/market/prices',
      'GET /api/market/historical',
      'GET /api/market/indicators',
      'GET /api/market/status'
    ],
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}`);
  console.log(`💚 Estado: http://localhost:${PORT}/health`);
  console.log(`📈 Precios: http://localhost:${PORT}/api/market/prices`);
  console.log(`📋 Info: http://localhost:${PORT}/api/info`);
});

export default app;