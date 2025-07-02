import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { marketApi } from '../services/api';
import useMarketStore from '../store/marketStore';

// Hook para obtener precios actuales con actualización automática
export const useMarketPrices = () => {
  const setPrices = useMarketStore((state) => state.setPrices);
  const setError = useMarketStore((state) => state.setError);

  const query = useQuery({
    queryKey: ['marketPrices'],
    queryFn: marketApi.getCurrentPrices,
    refetchInterval: 2000, // Actualizar cada 2 segundos
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (query.data) {
      setPrices(query.data);
      setError(null);
    }
    if (query.error) {
      setError((query.error as Error).message);
    }
  }, [query.data, query.error, setPrices, setError]);

  return query;
};

// Hook para obtener datos históricos
export const useHistoricalData = (symbol: string, timeframe: string) => {
  const setHistoricalData = useMarketStore((state) => state.setHistoricalData);
  const setError = useMarketStore((state) => state.setError);

  const query = useQuery({
    queryKey: ['historicalData', symbol, timeframe],
    queryFn: () => marketApi.getHistoricalData(symbol, timeframe, 100),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  useEffect(() => {
    if (query.data) {
      setHistoricalData(query.data);
      setError(null);
    }
    if (query.error) {
      setError((query.error as Error).message);
    }
  }, [query.data, query.error, setHistoricalData, setError]);

  return query;
};

// Hook para obtener indicadores técnicos
export const useTechnicalIndicators = (symbol: string, timeframe: string) => {
  const setIndicators = useMarketStore((state) => state.setIndicators);
  const setError = useMarketStore((state) => state.setError);

  const query = useQuery({
    queryKey: ['indicators', symbol, timeframe],
    queryFn: () => marketApi.getTechnicalIndicators(symbol, timeframe),
    staleTime: 30 * 1000, // 30 segundos
  });

  useEffect(() => {
    if (query.data) {
      setIndicators(query.data);
      setError(null);
    }
    if (query.error) {
      setError((query.error as Error).message);
    }
  }, [query.data, query.error, setIndicators, setError]);

  return query;
};

// Hook para obtener estado del mercado
export const useMarketStatus = () => {
  const setMarketStatus = useMarketStore((state) => state.setMarketStatus);
  const setError = useMarketStore((state) => state.setError);

  const query = useQuery({
    queryKey: ['marketStatus'],
    queryFn: marketApi.getMarketStatus,
    refetchInterval: 60 * 1000, // Actualizar cada minuto
  });

  useEffect(() => {
    if (query.data) {
      setMarketStatus(query.data);
      setError(null);
    }
    if (query.error) {
      setError((query.error as Error).message);
    }
  }, [query.data, query.error, setMarketStatus, setError]);

  return query;
};

// Hook para verificar la conexión del servidor
export const useServerHealth = () => {
  return useQuery({
    queryKey: ['serverHealth'],
    queryFn: marketApi.getServerHealth,
    refetchInterval: 30 * 1000, // Verificar cada 30 segundos
    retry: 3,
  });
};