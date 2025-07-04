// backend/src/app.ts - CON CLAUDE INTEGRADO
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Importar rutas
import marketRoutes from './routes/marketRoutes';
import analysisRoutes from './routes/analysisRoutes'; // NUEVA RUTA
import SocketManager from './websocket/socketManager';

// Cargar variables de entorno
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Inicializar SocketManager con Claude
const socketManager = new SocketManager(httpServer);

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas de API
app.use('/api/market', marketRoutes);
app.use('/api/analysis', analysisRoutes); // 🤖 NUEVA RUTA CLAUDE

// Ruta básica de prueba
app.get('/health', (req, res) => {
  const stats = socketManager.getStats();
  res.json({ 
    status: 'OK', 
    message: 'Trading Platform Backend con Claude AI está funcionando!',
    timestamp: new Date().toISOString(),
    connections: stats.connections,
    uptime: `${Math.floor(stats.uptime / 60)} minutos`,
    features: {
      realTimeData: true,
      claudeAnalysis: true,
      technicalIndicators: true,
      websocketConnections: stats.connections
    }
  });
});

// Ruta de información mejorada
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Trading Platform Pro API with Claude AI',
    version: '2.0.0',
    description: 'Professional trading platform with AI-powered analysis',
    features: [
      'Real-time market data from multiple providers',
      'AI analysis powered by Claude',
      'Technical indicators and risk management',
      'WebSocket real-time updates',
      'Multi-provider data fallback system'
    ],
    endpoints: {
      market: [
        'GET /api/market/prices - Current prices for all instruments',
        'GET /api/market/historical - Historical OHLC data',
        'GET /api/market/indicators - Technical indicators',
        'GET /api/market/status - Market session status'
      ],
      analysis: [
        'POST /api/analysis/analyze - AI market analysis',
        'GET /api/analysis/test - Test Claude API connection',
        'POST /api/analysis/batch - Batch analysis requests',
        'GET /api/analysis/info - Analysis API information'
      ],
      system: [
        'GET /health - System health and stats',
        'GET /api/info - API information'
      ]
    },
    websocket: {
      url: 'ws://localhost:3001',
      events: [
        'priceUpdate - Real-time price updates',
        'requestAnalysis - Request AI analysis',
        'analysisResult - Receive analysis results',
        'subscribe/unsubscribe - Symbol subscriptions'
      ]
    },
    supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500', 'NAS100', 'GER40'],
    dataProviders: ['Finnhub', 'Twelve Data', 'Alpha Vantage', 'Fallback Simulation'],
    aiProvider: 'Claude (Anthropic)',
    timestamp: new Date().toISOString()
  });
});

// Endpoint específico para test de Claude
app.get('/api/claude/status', async (req, res) => {
  try {
    // Este endpoint podría llamar al servicio Claude directamente
    res.json({
      success: true,
      data: {
        claudeIntegration: 'active',
        analysisEndpoint: '/api/analysis/analyze',
        testEndpoint: '/api/analysis/test',
        websocketSupport: true,
        fallbackMode: process.env.ANTHROPIC_API_KEY ? 'api-primary' : 'local-primary',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Claude status check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Ejemplo de uso de la API
app.get('/api/example', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Ejemplos de uso de la API',
      examples: {
        '1_market_prices': {
          method: 'GET',
          url: '/api/market/prices',
          description: 'Obtener precios actuales'
        },
        '2_claude_analysis': {
          method: 'POST',
          url: '/api/analysis/analyze',
          body: {
            query: "¿Qué opinas del EUR/USD ahora?",
            symbol: "EURUSD"
          },
          description: 'Análisis AI con Claude'
        },
        '3_websocket_analysis': {
          event: 'requestAnalysis',
          data: {
            query: "¿Es buen momento para oro?",
            symbol: "XAUUSD"
          },
          description: 'Análisis AI vía WebSocket'
        },
        '4_batch_analysis': {
          method: 'POST',
          url: '/api/analysis/batch',
          body: {
            queries: [
              { query: "¿EUR/USD alcista?", symbol: "EURUSD" },
              { query: "¿Oro subiendo?", symbol: "XAUUSD" }
            ]
          },
          description: 'Análisis múltiple en una sola request'
        }
      },
      tips: [
        'Usa WebSocket para updates en tiempo real',
        'Las queries pueden ser en lenguaje natural',
        'El sistema tiene fallback automático si falla Claude',
        'Los análisis incluyen niveles de soporte/resistencia',
        'Puedes probar con curl o Postman'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableRoutes: {
      market: '/api/market/*',
      analysis: '/api/analysis/*',
      health: '/health',
      info: '/api/info',
      examples: '/api/example'
    },
    suggestion: 'Check /api/info for complete API documentation',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('🚀 =================================');
  console.log(`🚀 Trading Platform Pro con Claude AI`);
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log('🚀 =================================');
  console.log(`📊 API: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`📈 Precios: http://localhost:${PORT}/api/market/prices`);
  console.log(`🤖 Claude: http://localhost:${PORT}/api/analysis/analyze`);
  console.log(`📋 Info: http://localhost:${PORT}/api/info`);
  console.log(`💡 Ejemplos: http://localhost:${PORT}/api/example`);
  console.log('🚀 =================================');
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🤖 Claude AI: ${process.env.ANTHROPIC_API_KEY ? 'Configurado' : 'Usando análisis local'}`);
  console.log('🚀 =================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  socketManager.stop();
  httpServer.close(() => {
    console.log('🛑 Server closed');
    process.exit(0);
  });
});

export default app;