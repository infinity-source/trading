import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import MarketDataService from '../services/marketDataService';

class SocketManager {
  private io: SocketIOServer;
  private marketDataService: MarketDataService;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST"]
      }
    });

    this.marketDataService = new MarketDataService();
    this.setupSocketHandlers();
    this.startPriceUpdates();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Suscribirse a símbolo específico
      socket.on('subscribe', (symbol: string) => {
        socket.join(`price:${symbol}`);
        console.log(`${socket.id} subscribed to ${symbol}`);
      });

      // Desuscribirse
      socket.on('unsubscribe', (symbol: string) => {
        socket.leave(`price:${symbol}`);
        console.log(`${socket.id} unsubscribed from ${symbol}`);
      });

      // Análisis con Claude
      socket.on('requestAnalysis', async (data) => {
        try {
          // Aquí integrarías con Claude API
          const analysis = await this.performMarketAnalysis(data);
          socket.emit('analysisResult', analysis);
        } catch (error) {
          socket.emit('analysisError', { error: 'Error in analysis' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  private startPriceUpdates() {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500', 'NAS100', 'GER40'];
    
    this.priceUpdateInterval = setInterval(async () => {
      for (const symbol of symbols) {
        try {
          const marketData = await this.marketDataService.getCurrentPrice(symbol);
          if (marketData) {
            this.io.to(`price:${symbol}`).emit('priceUpdate', marketData);
          }
        } catch (error) {
          console.error(`Error updating price for ${symbol}:`, error);
        }
      }
    }, 1000); // Actualizar cada segundo
  }

  private async performMarketAnalysis(data: any) {
    // Aquí integrarías con Claude API para análisis
    // Por ahora retornamos un análisis simulado
    return {
      symbol: data.symbol,
      recommendation: 'BUY',
      confidence: 8,
      analysis: 'Based on technical indicators, the market shows bullish momentum.',
      entry: data.currentPrice * 1.001,
      stopLoss: data.currentPrice * 0.995,
      takeProfit: data.currentPrice * 1.015,
      riskReward: '1:3'
    };
  }

  public stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
  }
}

export default SocketManager;