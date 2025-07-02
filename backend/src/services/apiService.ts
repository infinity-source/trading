import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const marketApi = {
  getCurrentPrices: () => apiClient.get('/market/prices'),
  getHistoricalData: (symbol: string, timeframe: string, outputsize?: number) =>
    apiClient.get('/market/historical', {
      params: { symbol, timeframe, outputsize }
    }),
  getTechnicalIndicators: (symbol: string, timeframe: string) =>
    apiClient.get('/market/indicators', {
      params: { symbol, timeframe }
    }),
};

export const tradeApi = {
  getTrades: () => apiClient.get('/trades'),
  createTrade: (trade: any) => apiClient.post('/trades', trade),
  updateTrade: (id: string, trade: any) => apiClient.put(`/trades/${id}`, trade),
  deleteTrade: (id: string) => apiClient.delete(`/trades/${id}`),
};