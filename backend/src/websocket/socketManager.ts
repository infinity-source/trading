// backend/src/websocket/socketManager.ts - CON MULTI-IA
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import MarketDataService from '../services/marketDataService';
import MultiAIAnalysisService from '../services/multiAIService';

class SocketManager {
  private io: SocketIOServer;
  private marketDataService: MarketDataService;
  private multiAIService: MultiAIAnalysisService;
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private connectionCount = 0;
  private lastPriceUpdate: Record<string, any> = {};

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"]
      }
    });

    this.marketDataService = new MarketDataService();
    this.multiAIService = new MultiAIAnalysisService();
    this.setupSocketHandlers();
    this.startPriceUpdates();
    
    console.log('🔌 SocketManager initialized with Multi-AI (Claude + DeepSeek)');
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      this.connectionCount++;
      console.log(`👤 User connected: ${socket.id} (Total: ${this.connectionCount})`);

      // Enviar precios actuales inmediatamente
      this.sendCurrentPrices(socket);

      // Suscribirse a símbolo específico
      socket.on('subscribe', (symbol: string) => {
        socket.join(`price:${symbol}`);
        console.log(`📊 ${socket.id} subscribed to ${symbol}`);
        
        if (this.lastPriceUpdate[symbol]) {
          socket.emit('priceUpdate', this.lastPriceUpdate[symbol]);
        }
      });

      // Desuscribirse
      socket.on('unsubscribe', (symbol: string) => {
        socket.leave(`price:${symbol}`);
        console.log(`📊 ${socket.id} unsubscribed from ${symbol}`);
      });

      // ⭐ ANÁLISIS MULTI-IA - PRINCIPAL FEATURE
      socket.on('requestAnalysis', async (data) => {
        try {
          console.log(`🤖 Multi-AI Analysis via WebSocket: ${data.symbol} - "${data.query}"`);
          
          // Obtener datos de mercado en tiempo real
          const marketData = await this.marketDataService.getCurrentPrice(data.symbol);
          if (!marketData) {
            socket.emit('analysisError', { 
              error: `No hay datos de mercado para ${data.symbol}`,
              symbol: data.symbol,
              timestamp: new Date().toISOString()
            });
            return;
          }

          // Obtener indicadores técnicos
          let indicators = null;
          try {
            const historicalData = await this.marketDataService.getHistoricalData(
              data.symbol, 
              '1H', 
              50
            );
            if (historicalData && historicalData.length > 0) {
              const prices = historicalData.map(d => d.close);
              indicators = {
                rsi: this.marketDataService.calculateRSI(prices),
                macd: this.marketDataService.calculateMACD(prices),
                vwap: this.marketDataService.calculateVWAP(historicalData)
              };
            }
          } catch (indicatorError) {
            console.log(`⚠️  Could not get indicators for ${data.symbol}`);
          }

          // 🧠 ANÁLISIS MULTI-IA
          const analysisRequest = {
            query: data.query,
            symbol: data.symbol,
            marketData,
            indicators,
            preferredProvider: data.provider || 'auto',
            compareResults: data.compare === true
          };

          const analysis = await this.multiAIService.analyzeMarket(analysisRequest);
          
          // Preparar respuesta completa
          const enhancedAnalysis = {
            // Datos del análisis principal
            analysis: analysis.primary.analysis,
            recommendation: analysis.primary.recommendation,
            confidence: analysis.primary.confidence,
            keyLevels: analysis.primary.keyLevels,
            riskManagement: analysis.primary.riskManagement,
            technicalView: analysis.primary.technicalView,
            catalysts: analysis.primary.catalysts,
            timeframe: analysis.primary.timeframe,
            
            // Información del sistema Multi-AI
            provider: analysis.provider,
            fallbackUsed: analysis.fallbackUsed,
            processingTime: analysis.processingTime,
            
            // Análisis comparativo si está disponible
            ...(analysis.comparison && {
              comparison: {
                agreement: analysis.comparison.agreement,
                summary: analysis.comparison.summary,
                recommendationMatch: analysis.comparison.recommendationMatch
              },
              hasSecondaryAnalysis: !!analysis.secondary
            }),
            
            // Contexto de mercado
            marketContext: {
              currentPrice: marketData.price,
              change24h: marketData.change,
              changePercent24h: marketData.changePercent,
              high24h: marketData.high24h,
              low24h: marketData.low24h,
              timestamp: marketData.timestamp,
              serverTime: new Date().toISOString()
            },
            
            // Información de la solicitud
            requestInfo: {
              symbol: data.symbol,
              query: data.query,
              hasIndicators: !!indicators,
              dataSource: 'real-time',
              requestedProvider: data.provider || 'auto'
            }
          };
          
          socket.emit('analysisResult', enhancedAnalysis);
          console.log(`✅ Multi-AI WebSocket analysis completed for ${data.symbol} (${analysis.provider}, ${analysis.processingTime}ms)`);
          
        } catch (error) {
          const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error);
          console.error(`❌ WebSocket analysis error for ${data.symbol}:`, errorMessage);
          socket.emit('analysisError', { 
            error: 'Error en el análisis. Inténtalo de nuevo.',
            details: errorMessage,
            symbol: data.symbol || 'unknown',
            timestamp: new Date().toISOString(),
            retryable: true
          });
        }
      });

      // 🧠 ANÁLISIS ESPECÍFICO CON CLAUDE
      socket.on('requestClaudeAnalysis', async (data) => {
        try {
          console.log(`🧠 Claude-specific analysis via WebSocket: ${data.symbol}`);
          
          const marketData = await this.marketDataService.getCurrentPrice(data.symbol);
          if (!marketData) {
            socket.emit('claudeAnalysisError', { error: `No data for ${data.symbol}` });
            return;
          }

          const analysis = await this.multiAIService.analyzeMarket({
            query: data.query,
            symbol: data.symbol,
            marketData,
            preferredProvider: 'claude'
          });

          socket.emit('claudeAnalysisResult', analysis);
          
        } catch (error) {
          socket.emit('claudeAnalysisError', { 
            error: error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error),
            fallbackAvailable: true
          });
        }
      });

      // 🔬 ANÁLISIS ESPECÍFICO CON DEEPSEEK
      socket.on('requestDeepSeekAnalysis', async (data) => {
        try {
          console.log(`🔬 DeepSeek-specific analysis via WebSocket: ${data.symbol}`);
          
          const marketData = await this.marketDataService.getCurrentPrice(data.symbol);
          if (!marketData) {
            socket.emit('deepseekAnalysisError', { error: `No data for ${data.symbol}` });
            return;
          }

          const analysis = await this.multiAIService.analyzeMarket({
            query: data.query,
            symbol: data.symbol,
            marketData,
            preferredProvider: 'deepseek'
          });

          socket.emit('deepseekAnalysisResult', analysis);
          
        } catch (error) {
          socket.emit('deepseekAnalysisError', { 
            error: error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error),
            fallbackAvailable: true
          });
        }
      });

      // 🔍 ANÁLISIS COMPARATIVO VIA WEBSOCKET
      socket.on('requestComparativeAnalysis', async (data) => {
        try {
          console.log(`🔍 Comparative analysis via WebSocket: ${data.symbol}`);
          
          const marketData = await this.marketDataService.getCurrentPrice(data.symbol);
          if (!marketData) {
            socket.emit('comparativeAnalysisError', { error: `No data for ${data.symbol}` });
            return;
          }

          const analysis = await this.multiAIService.analyzeMarket({
            query: data.query,
            symbol: data.symbol,
            marketData,
            preferredProvider: 'both',
            compareResults: true
          });

          socket.emit('comparativeAnalysisResult', analysis);
          
        } catch (error) {
          socket.emit('comparativeAnalysisError', { 
            error: error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error)
          });
        }
      });

      // 🧪 TEST DE PROVEEDORES VIA WEBSOCKET
      socket.on('testAIProviders', async () => {
        try {
          const providersStatus = await this.multiAIService.testAllProviders();
          const providersInfo = this.multiAIService.getProvidersInfo();
          
          socket.emit('aiProvidersTestResult', {
            status: providersStatus,
            info: providersInfo,
            usageStats: this.multiAIService.getUsageStats(),
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('aiProvidersTestError', { 
            error: error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error)
          });
        }
      });

      // Solicitar datos históricos
      socket.on('requestHistoricalData', async (data) => {
        try {
          const { symbol, timeframe, period } = data;
          const historicalData = await this.marketDataService.getHistoricalData(
            symbol, 
            timeframe, 
            period || 100
          );
          
          socket.emit('historicalDataResult', {
            symbol,
            timeframe,
            data: historicalData,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          socket.emit('historicalDataError', { 
            error: error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error),
            symbol: data.symbol,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Estado del servidor con información Multi-AI
      socket.on('requestStatus', () => {
        socket.emit('serverStatus', {
          status: 'online',
          connections: this.connectionCount,
          dataSource: 'multi-provider',
          aiAnalysis: 'multi-ai-enabled',
          aiProviders: ['claude', 'deepseek', 'local'],
          lastUpdate: new Date().toISOString(),
          availableSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500', 'NAS100', 'GER40'],
          features: [
            'real-time-prices', 
            'multi-ai-analysis', 
            'comparative-analysis',
            'technical-indicators', 
            'historical-data',
            'auto-fallback'
          ]
        });
      });

      socket.on('disconnect', () => {
        this.connectionCount--;
        console.log(`👤 User disconnected: ${socket.id} (Total: ${this.connectionCount})`);
      });
    });
  }

  private async sendCurrentPrices(socket: any) {
    try {
      const allPrices = await this.marketDataService.getAllPrices();
      socket.emit('initialPrices', allPrices);
      console.log(`📤 Sent initial prices to ${socket.id} (${Object.keys(allPrices).length} symbols)`);
    } catch (error) {
      console.error('Error sending initial prices:', error);
    }
  }

  private startPriceUpdates() {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500', 'NAS100', 'GER40'];
    
    console.log('🔄 Starting real-time price updates with Multi-AI analysis ready...');
    
    this.priceUpdateInterval = setInterval(async () => {
      const updatePromises = symbols.map(async (symbol) => {
        try {
          const marketData = await this.marketDataService.getCurrentPrice(symbol);
          if (marketData) {
            const lastPrice = this.lastPriceUpdate[symbol]?.price || 0;
            const priceChanged = Math.abs(marketData.price - lastPrice) > 0.0001;
            
            if (priceChanged || !this.lastPriceUpdate[symbol]) {
              this.lastPriceUpdate[symbol] = marketData;
              
              // Broadcast a suscriptores específicos
              this.io.to(`price:${symbol}`).emit('priceUpdate', marketData);
              
              // Broadcast general
              this.io.emit('priceUpdate', marketData);
              
              if (priceChanged) {
                console.log(`📈 ${symbol}: ${marketData.price} (${marketData.changePercent > 0 ? '+' : ''}${marketData.changePercent.toFixed(3)}%)`);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error updating ${symbol}:`, error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error));
        }
      });

      await Promise.allSettled(updatePromises);
    }, 2000);
  }

  // Estadísticas del servidor mejoradas
  getStats() {
    return {
      connections: this.connectionCount,
      lastUpdates: Object.keys(this.lastPriceUpdate).length,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        multiAIAnalysis: true,
        comparativeAnalysis: true,
        realTimeData: true,
        technicalIndicators: true,
        multiProvider: true,
        autoFallback: true
      },
      aiProviders: this.multiAIService.getProvidersInfo(),
      usageStats: this.multiAIService.getUsageStats()
    };
  }

  public stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
    
    this.marketDataService.destroy();
    console.log('🛑 SocketManager with Multi-AI stopped');
  }
}

export default SocketManager;