import { create } from 'zustand';
import type { MarketData, OHLCData, TechnicalIndicators, MarketStatus } from '../services/api';

export interface MarketStore {
  // Estado
  selectedSymbol: string;
  selectedTimeframe: string;
  prices: Record<string, MarketData>;
  historicalData: OHLCData[];
  indicators: TechnicalIndicators | null;
  marketStatus: MarketStatus | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  
  // Acciones
  setSelectedSymbol: (symbol: string) => void;
  setSelectedTimeframe: (timeframe: string) => void;
  setPrices: (prices: Record<string, MarketData>) => void;
  setHistoricalData: (data: OHLCData[]) => void;
  setIndicators: (indicators: TechnicalIndicators) => void;
  setMarketStatus: (status: MarketStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateLastUpdate: () => void;
  
  // Getters computados
  getCurrentPrice: () => MarketData | null;
  getFormattedPrice: () => string;
  getPriceChange: () => { change: number; changePercent: number; isPositive: boolean };
}

const useMarketStore = create<MarketStore>((set, get) => ({
  // Estado inicial
  selectedSymbol: 'EURUSD',
  selectedTimeframe: '1H',
  prices: {},
  historicalData: [],
  indicators: null,
  marketStatus: null,
  isLoading: false,
  error: null,
  lastUpdate: 0,

  // Acciones
  setSelectedSymbol: (symbol: string) => set({ selectedSymbol: symbol }),
  
  setSelectedTimeframe: (timeframe: string) => set({ selectedTimeframe: timeframe }),
  
  setPrices: (prices: Record<string, MarketData>) => 
    set({ prices, lastUpdate: Date.now() }),
  
  setHistoricalData: (data: OHLCData[]) => set({ historicalData: data }),
  
  setIndicators: (indicators: TechnicalIndicators) => set({ indicators }),
  
  setMarketStatus: (status: MarketStatus) => set({ marketStatus: status }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
  
  updateLastUpdate: () => set({ lastUpdate: Date.now() }),

  // Getters computados
  getCurrentPrice: () => {
    const { selectedSymbol, prices } = get();
    return prices[selectedSymbol] || null;
  },

  getFormattedPrice: () => {
    const currentPrice = get().getCurrentPrice();
    if (!currentPrice) return '0.0000';
    
    const { selectedSymbol } = get();
    
    // Formatear según el tipo de instrumento
    if (selectedSymbol.includes('JPY')) {
      return currentPrice.price.toFixed(2);
    }
    
    if (selectedSymbol === 'XAUUSD') {
      return currentPrice.price.toFixed(2);
    }
    
    if (selectedSymbol.includes('500') || selectedSymbol.includes('100') || selectedSymbol === 'GER40') {
      return currentPrice.price.toFixed(2);
    }
    
    return currentPrice.price.toFixed(4);
  },

  getPriceChange: () => {
    const currentPrice = get().getCurrentPrice();
    if (!currentPrice) {
      return { change: 0, changePercent: 0, isPositive: true };
    }
    
    return {
      change: currentPrice.change,
      changePercent: currentPrice.changePercent,
      isPositive: currentPrice.change >= 0
    };
  }
}));

export default useMarketStore;