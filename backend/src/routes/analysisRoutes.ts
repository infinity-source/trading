// backend/src/routes/analysisRoutes.ts - CON MULTI-IA
import express from 'express';
import { 
  analyzeMarket,
  analyzeWithClaude,
  analyzeWithDeepSeek,
  compareAnalyses,
  testAllProviders,
  analyzeBatch,
  getRecentAnalyses
} from '../controllers/analysisController';

const router = express.Router();

// 🤖 RUTA PRINCIPAL - Multi-AI Analysis
router.post('/analyze', analyzeMarket);

// 🧠 PROVEEDORES ESPECÍFICOS
router.post('/claude', analyzeWithClaude);
router.post('/deepseek', analyzeWithDeepSeek);

// 🔍 ANÁLISIS COMPARATIVO
router.post('/compare', compareAnalyses);

// 🧪 TESTING Y DIAGNÓSTICOS
router.get('/test', testAllProviders);

// 📊 ANÁLISIS EN LOTE
router.post('/batch', analyzeBatch);

// 📈 ANÁLISIS RECIENTES
router.get('/recent', getRecentAnalyses);

// 📋 INFORMACIÓN COMPLETA DE LA API
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Multi-AI Financial Analysis API',
      version: '2.0.0',
      description: 'Advanced AI-powered financial market analysis using Claude, DeepSeek, and enhanced local analysis',
      
      providers: {
        claude: {
          description: 'Anthropic Claude - Advanced reasoning and detailed analysis',
          endpoint: '/api/analysis/claude',
          strengths: ['Complex reasoning', 'Detailed explanations', 'Risk analysis']
        },
        deepseek: {
          description: 'DeepSeek - Fast and cost-effective analysis',
          endpoint: '/api/analysis/deepseek',
          strengths: ['Technical analysis', 'Fast processing', 'Cost effective']
        },
        local: {
          description: 'Enhanced local analysis with real market data',
          strengths: ['Always available', 'Real-time data', 'No API costs']
        }
      },

      endpoints: [
        {
          method: 'POST',
          path: '/api/analysis/analyze',
          description: 'Multi-AI analysis with automatic provider selection',
          body: {
            query: "string - Your market question",
            symbol: "string - Trading symbol (EURUSD, XAUUSD, etc.)",
            provider: "string - Optional: 'auto', 'claude', 'deepseek', 'both'",
            compare: "boolean - Optional: true for comparative analysis"
          },
          example: {
            query: "¿Qué opinas del EUR/USD ahora?",
            symbol: "EURUSD",
            provider: "auto",
            compare: false
          }
        },
        {
          method: 'POST',
          path: '/api/analysis/claude',
          description: 'Analysis specifically with Claude AI',
          body: {
            query: "string - Your market question", 
            symbol: "string - Trading symbol"
          }
        },
        {
          method: 'POST',
          path: '/api/analysis/deepseek',
          description: 'Analysis specifically with DeepSeek AI',
          body: {
            query: "string - Your market question",
            symbol: "string - Trading symbol"
          }
        },
        {
          method: 'POST',
          path: '/api/analysis/compare',
          description: 'Comparative analysis using multiple AI providers',
          body: {
            query: "string - Your market question",
            symbol: "string - Trading symbol"
          }
        },
        {
          method: 'POST',
          path: '/api/analysis/batch',
          description: 'Analyze multiple queries at once',
          body: {
            queries: [
              { query: "string", symbol: "string" }
            ],
            provider: "string - Optional provider preference"
          }
        },
        {
          method: 'GET',
          path: '/api/analysis/test',
          description: 'Test all AI provider connections and get status'
        }
      ],

      supportedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500', 'NAS100', 'GER40'],
      
      queryExamples: [
        "¿Qué opinas del EUR/USD ahora?",
        "¿Es buen momento para entrar en oro?", 
        "Analiza el RSI del SPX500",
        "¿Hay confluencia técnica en GBP/USD?",
        "¿El Nasdaq está sobrecomprado?",
        "¿Qué niveles de soporte tiene el oro?",
        "¿Es momento de vender EUR/USD?",
        "Análisis técnico del DAX alemán"
      ],

      features: [
        'Real-time market data integration',
        'Technical indicators analysis (RSI, MACD, VWAP)',
        'Risk management calculations (Stop Loss, Take Profit)',
        'Support/Resistance level identification',
        'Multi-language support (Spanish primary)',
        'Automatic fallback between providers',
        'Comparative analysis for high-confidence decisions',
        'Batch processing for multiple queries',
        'WebSocket support for real-time analysis'
      ],

      responseFormat: {
        analysis: "Detailed market analysis text",
        recommendation: "BUY/SELL/HOLD with specific reason",
        confidence: "Number from 1-10",
        keyLevels: {
          support: "Support level price",
          resistance: "Resistance level price", 
          entry: "Recommended entry price"
        },
        riskManagement: {
          stopLoss: "Stop loss level",
          takeProfit: "Take profit level",
          riskReward: "Risk:reward ratio"
        },
        technicalView: "Summary of technical indicators",
        catalysts: ["Market factors that could affect price"],
        timeframe: "Recommended trading timeframe",
        provider: "AI provider used for analysis",
        processingTime: "Analysis processing time in ms"
      },

      usage: {
        rateLimit: "No rate limits currently",
        authentication: "No authentication required",
        cors: "Enabled for localhost development",
        costs: "Free tier with fallback to local analysis"
      },

      tips: [
        "Use 'auto' provider for best availability and performance",
        "Use 'both' provider for high-stakes trading decisions",
        "Queries can be in natural language (Spanish or English)",
        "Include specific timeframes in your queries for better analysis",
        "DeepSeek is faster, Claude provides more detailed reasoning",
        "Local analysis is always available as fallback",
        "WebSocket provides real-time analysis with lower latency"
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// 🔧 CONFIGURACIÓN Y ESTADO
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'Multi-AI Analysis Service',
      status: 'operational',
      endpoints: {
        analyze: 'POST /api/analysis/analyze',
        claude: 'POST /api/analysis/claude', 
        deepseek: 'POST /api/analysis/deepseek',
        compare: 'POST /api/analysis/compare',
        batch: 'POST /api/analysis/batch',
        test: 'GET /api/analysis/test'
      },
      documentation: 'GET /api/analysis/info',
      websocket: 'Available at ws://localhost:3001',
      version: '2.0.0'
    },
    timestamp: new Date().toISOString()
  });
});

// 💡 EJEMPLOS INTERACTIVOS
router.get('/examples', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Ejemplos interactivos de uso',
      examples: {
        '1_basic_analysis': {
          description: 'Análisis básico con selección automática de proveedor',
          curl: `curl -X POST http://localhost:3001/api/analysis/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"query":"¿Qué opinas del EUR/USD ahora?","symbol":"EURUSD"}'`
        },
        '2_claude_specific': {
          description: 'Análisis específico con Claude AI',
          curl: `curl -X POST http://localhost:3001/api/analysis/claude \\
  -H "Content-Type: application/json" \\
  -d '{"query":"Análisis técnico detallado del oro","symbol":"XAUUSD"}'`
        },
        '3_deepseek_specific': {
          description: 'Análisis específico con DeepSeek',
          curl: `curl -X POST http://localhost:3001/api/analysis/deepseek \\
  -H "Content-Type: application/json" \\
  -d '{"query":"¿SPX500 en sobrecompra?","symbol":"SPX500"}'`
        },
        '4_comparative_analysis': {
          description: 'Análisis comparativo con múltiples proveedores',
          curl: `curl -X POST http://localhost:3001/api/analysis/compare \\
  -H "Content-Type: application/json" \\
  -d '{"query":"¿Es momento de comprar GBP/USD?","symbol":"GBPUSD"}'`
        },
        '5_batch_analysis': {
          description: 'Análisis en lote de múltiples instrumentos',
          curl: `curl -X POST http://localhost:3001/api/analysis/batch \\
  -H "Content-Type: application/json" \\
  -d '{"queries":[{"query":"¿EUR/USD alcista?","symbol":"EURUSD"},{"query":"¿Oro subiendo?","symbol":"XAUUSD"}]}'`
        },
        '6_test_providers': {
          description: 'Test del estado de todos los proveedores',
          curl: `curl http://localhost:3001/api/analysis/test`
        }
      },
      javascriptExample: `
// Ejemplo en JavaScript
const analyzeMarket = async () => {
  const response = await fetch('http://localhost:3001/api/analysis/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: '¿Qué opinas del EUR/USD ahora?',
      symbol: 'EURUSD',
      provider: 'auto'
    })
  });
  
  const result = await response.json();
  console.log(result.data.analysis);
  console.log(result.data.recommendation);
};`,
      websocketExample: `
// Ejemplo WebSocket para análisis en tiempo real
const socket = io('http://localhost:3001');

socket.emit('requestAnalysis', {
  query: '¿Es buen momento para oro?',
  symbol: 'XAUUSD'
});

socket.on('analysisResult', (analysis) => {
  console.log(analysis.analysis);
  console.log(analysis.recommendation);
});`
    },
    timestamp: new Date().toISOString()
  });
});

export default router;