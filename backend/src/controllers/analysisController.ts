// backend/src/controllers/analysisController.ts - CON MULTI-IA
import { Request, Response } from 'express';
import MultiAIAnalysisService from '../services/multiAIService';
import MarketDataService from '../services/marketDataService';

const multiAIService = new MultiAIAnalysisService();
const marketDataService = new MarketDataService();

// 🤖 ANÁLISIS PRINCIPAL CON MULTI-IA
export const analyzeMarket = async (req: Request, res: Response) => {
  try {
    const { query, symbol, provider, compare } = req.body;

    if (!query || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Query and symbol are required',
        example: {
          query: "¿Qué opinas del EUR/USD ahora?",
          symbol: "EURUSD",
          provider: "auto", // opcional: claude, deepseek, both, auto
          compare: false // opcional: true para análisis comparativo
        }
      });
    }

    console.log(`🤖 Multi-AI Analysis: ${symbol} - "${query}" (provider: ${provider || 'auto'})`);

    // Obtener datos de mercado en tiempo real
    const marketData = await marketDataService.getCurrentPrice(symbol);
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: `No market data available for ${symbol}`,
        availableSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500', 'NAS100', 'GER40']
      });
    }

    // Obtener indicadores técnicos
    let indicators = null;
    try {
      const historicalData = await marketDataService.getHistoricalData(symbol, '1H', 50);
      if (historicalData && historicalData.length > 0) {
        const prices = historicalData.map(d => d.close);
        indicators = {
          rsi: marketDataService.calculateRSI(prices),
          macd: marketDataService.calculateMACD(prices),
          vwap: marketDataService.calculateVWAP(historicalData)
        };
      }
    } catch (error) {
      console.log(`⚠️  Could not calculate indicators for ${symbol}`);
    }

    // Realizar análisis multi-IA
    const analysisRequest = {
      query,
      symbol,
      marketData,
      indicators,
      preferredProvider: provider || 'auto',
      compareResults: compare === true || provider === 'both'
    };

    const analysis = await multiAIService.analyzeMarket(analysisRequest);

    // Respuesta exitosa con información detallada
    res.json({
      success: true,
      data: {
        // Análisis principal
        analysis: analysis.primary.analysis,
        recommendation: analysis.primary.recommendation,
        confidence: analysis.primary.confidence,
        keyLevels: analysis.primary.keyLevels,
        riskManagement: analysis.primary.riskManagement,
        technicalView: analysis.primary.technicalView,
        catalysts: analysis.primary.catalysts,
        timeframe: analysis.primary.timeframe,
        
        // Información del análisis
        provider: analysis.provider,
        fallbackUsed: analysis.fallbackUsed,
        processingTime: analysis.processingTime,
        
        // Análisis comparativo (si está disponible)
        ...(analysis.comparison && {
          comparison: analysis.comparison,
          secondaryAnalysis: analysis.secondary
        }),
        
        // Contexto de mercado
        marketContext: {
          currentPrice: marketData.price,
          change24h: marketData.change,
          changePercent24h: marketData.changePercent,
          high24h: marketData.high24h,
          low24h: marketData.low24h,
          timestamp: marketData.timestamp
        },
        
        // Información de la solicitud
        requestInfo: {
          symbol,
          query,
          hasIndicators: !!indicators,
          requestedProvider: provider || 'auto',
          compareRequested: compare === true
        }
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Multi-AI Analysis completed for ${symbol} (${analysis.provider}, ${analysis.processingTime}ms)`);

  } catch (error) {
    console.error('❌ Multi-AI Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Error performing analysis',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// 🔬 ANÁLISIS ESPECÍFICO CON DEEPSEEK
export const analyzeWithDeepSeek = async (req: Request, res: Response) => {
  try {
    const { query, symbol } = req.body;

    if (!query || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Query and symbol are required for DeepSeek analysis'
      });
    }

    const marketData = await marketDataService.getCurrentPrice(symbol);
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: `No market data available for ${symbol}`
      });
    }

    const analysis = await multiAIService.analyzeMarket({
      query,
      symbol,
      marketData,
      preferredProvider: 'deepseek'
    });

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'DeepSeek analysis failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
};

// 🧠 ANÁLISIS ESPECÍFICO CON CLAUDE
export const analyzeWithClaude = async (req: Request, res: Response) => {
  try {
    const { query, symbol } = req.body;

    if (!query || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Query and symbol are required for Claude analysis'
      });
    }

    const marketData = await marketDataService.getCurrentPrice(symbol);
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: `No market data available for ${symbol}`
      });
    }

    const analysis = await multiAIService.analyzeMarket({
      query,
      symbol,
      marketData,
      preferredProvider: 'claude'
    });

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Claude analysis failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
};

// 🔍 ANÁLISIS COMPARATIVO
export const compareAnalyses = async (req: Request, res: Response) => {
  try {
    const { query, symbol } = req.body;

    if (!query || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Query and symbol are required for comparative analysis'
      });
    }

    console.log(`🔍 Comparative analysis requested for ${symbol}: "${query}"`);

    const marketData = await marketDataService.getCurrentPrice(symbol);
    if (!marketData) {
      return res.status(404).json({
        success: false,
        error: `No market data available for ${symbol}`
      });
    }

    const analysis = await multiAIService.analyzeMarket({
      query,
      symbol,
      marketData,
      preferredProvider: 'both',
      compareResults: true
    });

    res.json({
      success: true,
      data: {
        ...analysis,
        note: "Comparative analysis with multiple AI providers",
        recommendation: analysis.comparison 
          ? `Consenso: ${analysis.comparison.agreement}% - ${analysis.comparison.summary}`
          : "Solo un proveedor disponible"
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Comparative analysis failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
};

// 🧪 TEST DE TODOS LOS PROVEEDORES
export const testAllProviders = async (req: Request, res: Response) => {
  try {
    const providersStatus = await multiAIService.testAllProviders();
    const providersInfo = multiAIService.getProvidersInfo();
    
    res.json({
      success: true,
      data: {
        status: providersStatus,
        info: providersInfo,
        usageStats: multiAIService.getUsageStats(),
        recommendations: {
          claude: "Best for complex reasoning and detailed analysis",
          deepseek: "Fast and cost-effective, good for technical analysis",
          local: "Always available, enhanced with real market data",
          comparative: "Use 'both' provider for high-confidence decisions"
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error testing providers',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
};

// 📊 ANÁLISIS EN LOTE CON SELECCIÓN DE PROVEEDOR
export const analyzeBatch = async (req: Request, res: Response) => {
  try {
    const { queries, provider } = req.body;

    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({
        success: false,
        error: 'Queries array is required',
        example: {
          queries: [
            { query: "¿EUR/USD alcista?", symbol: "EURUSD" },
            { query: "¿Oro subiendo?", symbol: "XAUUSD" }
          ],
          provider: "auto" // opcional: claude, deepseek, auto
        }
      });
    }

    console.log(`🔄 Batch analysis: ${queries.length} queries (provider: ${provider || 'auto'})`);

    const results = await Promise.allSettled(
      queries.map(async ({ query, symbol }) => {
        if (!query || !symbol) {
          throw new Error(`Invalid query/symbol pair`);
        }

        const marketData = await marketDataService.getCurrentPrice(symbol);
        if (!marketData) {
          throw new Error(`No data for ${symbol}`);
        }

        const analysis = await multiAIService.analyzeMarket({
          query,
          symbol,
          marketData,
          preferredProvider: provider || 'auto'
        });

        return {
          query,
          symbol,
          analysis: analysis.primary,
          provider: analysis.provider,
          processingTime: analysis.processingTime,
          marketData: {
            price: marketData.price,
            changePercent: marketData.changePercent
          }
        };
      })
    );

    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);

    const failed = results
      .filter(r => r.status === 'rejected')
      .map(r => ({
        error: (r as PromiseRejectedResult).reason.message
      }));

    res.json({
      success: true,
      data: {
        successful,
        failed,
        totalRequested: queries.length,
        successCount: successful.length,
        failureCount: failed.length,
        averageProcessingTime: successful.length > 0 
          ? Math.round(successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length)
          : 0,
        providersUsed: [...new Set(successful.map(r => r.provider))]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch analysis failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
};

// 📈 ANÁLISIS RECIENTES (placeholder para futuro)
export const getRecentAnalyses = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        recentAnalyses: [],
        message: "Recent analyses feature coming soon",
        availableEndpoints: [
          "POST /api/analysis/analyze - Multi-AI analysis",
          "POST /api/analysis/claude - Claude-specific analysis", 
          "POST /api/analysis/deepseek - DeepSeek-specific analysis",
          "POST /api/analysis/compare - Comparative analysis",
          "GET /api/analysis/test - Test all providers"
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
      timestamp: new Date().toISOString()
    });
  }
};