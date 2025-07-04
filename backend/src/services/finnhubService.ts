// backend/src/services/finnhubService.ts npm install --save-dev @types/ws
import axios from 'axios';
import WebSocket from 'ws';

interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

class FinnhubService {
  private apiKey: string;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Function[]> = new Map();
  private cache: Map<string, { data: MarketData; expiry: number }> = new Map();

  // Mapeo de símbolos a formato Finnhub
  private symbolMapping: Record<string, string> = {
    'EURUSD': 'OANDA:EUR_USD',
    'GBPUSD': 'OANDA:GBP_USD', 
    'USDJPY': 'OANDA:USD_JPY',
    'XAUUSD': 'OANDA:XAU_USD',
    'SPX500': 'INDEX:SPX',
    'NAS100': 'INDEX:NDX',
    'GER40': 'INDEX:DAX'
  };

  constructor() {
    this.apiKey = 'd1k1ss9r01ql1h3a559gd1k1ss9r01ql1h3a55a0';
    this.connectWebSocket();
  }

  // Obtener precio actual via REST API
  async getCurrentPrice(symbol: string): Promise<MarketData | null> {
    try {
      const cacheKey = `price:${symbol}`;
      const cached = this.getCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const finnhubSymbol = this.symbolMapping[symbol];
      if (!finnhubSymbol) {
        console.warn(`No Finnhub mapping for ${symbol}`);
        return null;
      }

      const url = `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${this.apiKey}`;
      const response = await axios.get<FinnhubQuote>(url);
      
      const data = response.data;
      
      // Verificar que tenemos datos válidos
      if (!data.c || data.c === 0) {
        console.warn(`No valid data for ${symbol} from Finnhub`);
        return null;
      }

      const marketData: MarketData = {
        symbol,
        price: data.c,
        change: data.d || 0,
        changePercent: data.dp || 0,
        volume: 0, // Finnhub no siempre tiene volumen para forex
        high24h: data.h || data.c,
        low24h: data.l || data.c,
        timestamp: Date.now()
      };

      // Cache por 5 segundos
      this.setCache(cacheKey, marketData, 5);
      
      console.log(`✅ ${symbol}: ${data.c} (${data.dp}%)`);
      return marketData;

    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error fetching ${symbol} from Finnhub:`, error.message);
      } else {
        console.error(`Error fetching ${symbol} from Finnhub:`, error);
      }
      return null;
    }
  }

  // Obtener múltiples precios
  async getAllPrices(): Promise<Record<string, MarketData>> {
    const symbols = Object.keys(this.symbolMapping);
    const promises = symbols.map(symbol => this.getCurrentPrice(symbol));
    const results = await Promise.all(promises);
    
    const pricesMap: Record<string, MarketData> = {};
    symbols.forEach((symbol, index) => {
      if (results[index]) {
        pricesMap[symbol] = results[index]!;
      }
    });
    
    console.log(`📊 Finnhub: Retrieved ${Object.keys(pricesMap).length}/${symbols.length} prices`);
    return pricesMap;
  }

  // WebSocket para datos en tiempo real
  private connectWebSocket() {
    try {
      this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);
      
      this.ws.on('open', () => {
        console.log('🔗 Finnhub WebSocket connected');
        
        // Suscribirse a todos los símbolos
        Object.values(this.symbolMapping).forEach(symbol => {
          this.ws?.send(JSON.stringify({
            'type': 'subscribe',
            'symbol': symbol
          }));
        });
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'trade') {
            this.handleTradeUpdate(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('❌ Finnhub WebSocket disconnected');
        // Reconectar después de 5 segundos
        setTimeout(() => this.connectWebSocket(), 5000);
      });

      this.ws.on('error', (error) => {
        console.error('Finnhub WebSocket error:', error);
      });

    } catch (error) {
      console.error('Error connecting to Finnhub WebSocket:', error);
    }
  }

  private handleTradeUpdate(message: any) {
    // Procesar actualizaciones de trades en tiempo real
    if (message.data && message.data.length > 0) {
      message.data.forEach((trade: any) => {
        const symbol = this.findSymbolByFinnhubSymbol(trade.s);
        if (symbol) {
          // Notificar a los suscriptores
          this.notifySubscribers(symbol, {
            symbol,
            price: trade.p,
            timestamp: trade.t,
            volume: trade.v
          });
        }
      });
    }
  }

  private findSymbolByFinnhubSymbol(finnhubSymbol: string): string | null {
    for (const [symbol, mappedSymbol] of Object.entries(this.symbolMapping)) {
      if (mappedSymbol === finnhubSymbol) {
        return symbol;
      }
    }
    return null;
  }

  // Sistema de suscripciones para WebSocket
  subscribe(symbol: string, callback: Function) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol)!.push(callback);
  }

  unsubscribe(symbol: string, callback: Function) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifySubscribers(symbol: string, data: any) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Cache helpers
  private setCache(key: string, data: MarketData, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }

  private getCache(key: string): MarketData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Cleanup
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default FinnhubService;