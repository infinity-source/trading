import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interfaces para TypeScript
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  vwap: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  fibonacci: {
    level618: number;
    level50: number;
    level382: number;
  };
}

export interface MarketStatus {
  isOpen: boolean;
  session: string;
  nextSession: string;
  timeToNextSession: string;
  volatility: string;
  majorNews: Array<{
    time: string;
    event: string;
    impact: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// API Methods
export const marketApi = {
  // Obtener precios actuales de todos los instrumentos
  getCurrentPrices: async (): Promise<Record<string, MarketData>> => {
    const response = await apiClient.get<ApiResponse<Record<string, MarketData>>>('/market/prices');
    return response.data.data;
  },

  // Obtener datos históricos de un instrumento específico
  getHistoricalData: async (
    symbol: string,
    timeframe: string,
    outputsize: number = 100
  ): Promise<OHLCData[]> => {
    const response = await apiClient.get<ApiResponse<OHLCData[]>>('/market/historical', {
      params: { symbol, timeframe, outputsize }
    });
    return response.data.data;
  },

  // Obtener indicadores técnicos
  getTechnicalIndicators: async (
    symbol: string,
    timeframe: string
  ): Promise<TechnicalIndicators> => {
    const response = await apiClient.get<ApiResponse<TechnicalIndicators>>('/market/indicators', {
      params: { symbol, timeframe }
    });
    return response.data.data;
  },

  // Obtener estado del mercado
  getMarketStatus: async (): Promise<MarketStatus> => {
    const response = await apiClient.get<ApiResponse<MarketStatus>>('/market/status');
    return response.data.data;
  },

  // Verificar estado del servidor
  getServerHealth: async (): Promise<{ status: string; message: string; timestamp: string }> => {
    const response = await axios.get('http://localhost:3001/health');
    return response.data;
  }
};

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('No se puede conectar al servidor. Asegúrate de que el backend esté ejecutándose.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Endpoint no encontrado.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Error interno del servidor.');
    }
    
    throw error;
  }
);

export default apiClient;