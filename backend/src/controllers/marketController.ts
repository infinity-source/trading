import { Request, Response } from 'express';
import MarketDataService from '../services/marketDataService';

const marketDataService = new MarketDataService();

export const getCurrentPrices = async (req: Request, res: Response) => {
  try {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500', 'NAS100', 'GER40'];
    
    const pricesPromises = symbols.map(symbol => 
      marketDataService.getCurrentPrice(symbol)
    );
    
    const prices = await Promise.all(pricesPromises);
    const pricesMap = symbols.reduce((acc, symbol, index) => {
      acc[symbol] = prices[index];
      return acc;
    }, {} as Record<string, any>);

    res.json({
      success: true,
      data: pricesMap,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching market data',
      timestamp: new Date().toISOString()
    });
  }
};

export const getHistoricalData = async (req: Request, res: Response) => {
  try {
    const { symbol, timeframe, outputsize } = req.query;
    
    if (!symbol || !timeframe) {
      return res.status(400).json({ 
        success: false,
        error: 'Symbol and timeframe are required' 
      });
    }

    const data = await marketDataService.getHistoricalData(
      symbol as string,
      timeframe as string,
      parseInt(outputsize as string) || 100
    );

    res.json({
      success: true,
      data: data,
      symbol: symbol,
      timeframe: timeframe,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error fetching historical data',
      timestamp: new Date().toISOString()
    });
  }
};

export const getTechnicalIndicators = async (req: Request, res: Response) => {
  try {
    const { symbol, timeframe } = req.query;
    
    if (!symbol || !timeframe) {
      return res.status(400).json({ 
        success: false,
        error: 'Symbol and timeframe are required' 
      });
    }

    const historicalData = await marketDataService.getHistoricalData(
      symbol as string,
      timeframe as string,
      50
    );

    const prices = historicalData.map(d => d.close);
    
    const indicators = {
      rsi: marketDataService.calculateRSI(prices),
      macd: marketDataService.calculateMACD(prices),
      vwap: marketDataService.calculateVWAP(historicalData),
      bollinger: marketDataService.calculateBollingerBands(prices),
      fibonacci: marketDataService.calculateFibonacci(historicalData)
    };

    res.json({
      success: true,
      data: indicators,
      symbol: symbol,
      timeframe: timeframe,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating indicators:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error calculating indicators',
      timestamp: new Date().toISOString()
    });
  }
};

export const getMarketStatus = async (req: Request, res: Response) => {
  try {
    const status = {
      isOpen: true,
      session: 'London',
      nextSession: 'New York',
      timeToNextSession: '2h 30m',
      volatility: 'Medium',
      majorNews: [
        { time: '14:30', event: 'USD Non-Farm Payrolls', impact: 'High' },
        { time: '16:00', event: 'EUR Interest Rate Decision', impact: 'High' }
      ]
    };

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Error fetching market status',
      timestamp: new Date().toISOString()
    });
  }
};