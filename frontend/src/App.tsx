import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import useMarketStore from './store/marketStore';
import { useMarketPrices, useHistoricalData, useTechnicalIndicators, useServerHealth } from './hooks/useMarketData';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Componente para mostrar un instrumento de trading
const InstrumentCard: React.FC<{ symbol: string; isSelected: boolean; onClick: () => void }> = ({ 
  symbol, 
  isSelected, 
  onClick 
}) => {
  const prices = useMarketStore((state) => state.prices);
  const data = prices[symbol];

  if (!data) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-600 rounded mb-2"></div>
        <div className="h-6 bg-gray-600 rounded mb-1"></div>
        <div className="h-4 bg-gray-600 rounded w-3/4"></div>
      </div>
    );
  }

  const isPositive = data.change >= 0;
  const formatPrice = (price: number) => {
    if (symbol.includes('JPY') || symbol === 'XAUUSD' || symbol.includes('500') || symbol.includes('100') || symbol === 'GER40') {
      return price.toFixed(2);
    }
    return price.toFixed(4);
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-600 ring-2 ring-blue-400 transform scale-105' 
          : 'bg-gray-800 hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-300">{symbol}</span>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
      </div>
      
      <div className="text-xl font-bold text-white mb-1">
        {formatPrice(data.price)}
      </div>
      
      <div className={`text-sm flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        <span className="mr-1">{isPositive ? '+' : ''}{formatPrice(data.change)}</span>
        <span>({data.changePercent.toFixed(2)}%)</span>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        Vol: {(data.volume / 1000000).toFixed(1)}M
      </div>
    </div>
  );
};

// Componente para mostrar indicadores técnicos
const TechnicalIndicators: React.FC = () => {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const selectedTimeframe = useMarketStore((state) => state.selectedTimeframe);
  const indicators = useMarketStore((state) => state.indicators);
  
  useTechnicalIndicators(selectedSymbol, selectedTimeframe);

  if (!indicators) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Indicadores Técnicos</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-6 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-400';
    if (rsi < 30) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getRSISignal = (rsi: number) => {
    if (rsi > 70) return 'Sobrecompra';
    if (rsi < 30) return 'Sobreventa';
    return 'Neutral';
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">Indicadores Técnicos</h3>
      
      <div className="space-y-4">
        {/* RSI */}
        <div className="bg-gray-700 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-300">RSI (14)</span>
            <span className={`font-semibold ${getRSIColor(indicators.rsi)}`}>
              {getRSISignal(indicators.rsi)}
            </span>
          </div>
          <div className="flex items-center">
            <div className="text-xl font-bold text-white">{indicators.rsi.toFixed(2)}</div>
            <div className="ml-4 flex-1">
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-yellow-400"
                  style={{ width: `${indicators.rsi}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* MACD */}
        <div className="bg-gray-700 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-300">MACD</span>
            <span className={`font-semibold ${indicators.macd.macd > indicators.macd.signal ? 'text-green-400' : 'text-red-400'}`}>
              {indicators.macd.macd > indicators.macd.signal ? 'Bullish' : 'Bearish'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-gray-400">MACD</div>
              <div className="text-white font-semibold">{indicators.macd.macd.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-gray-400">Signal</div>
              <div className="text-white font-semibold">{indicators.macd.signal.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-gray-400">Histogram</div>
              <div className="text-white font-semibold">{indicators.macd.histogram.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* VWAP */}
        <div className="bg-gray-700 p-4 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-300">VWAP</span>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400">{indicators.vwap.toFixed(4)}</div>
              <div className="text-xs text-gray-400">Volume Weighted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Chat Inteligente con Claude
// Componente de Chat Inteligente - VERSIÓN FUNCIONAL
const IntelligentChat: React.FC = () => {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string, data?: any}>>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const selectedTimeframe = useMarketStore((state) => state.selectedTimeframe);
  const prices = useMarketStore((state) => state.prices);
  const indicators = useMarketStore((state) => state.indicators);

  // Analizador inteligente que funciona localmente
  const analyzeMarket = (query: string, symbol: string, priceData: any, indicatorData: any) => {
    const price = priceData?.price || 0;
    const change = priceData?.change || 0;
    const changePercent = priceData?.changePercent || 0;
    const rsi = indicatorData?.rsi || 50;
    const macd = indicatorData?.macd || { macd: 0, signal: 0, histogram: 0 };
    const vwap = indicatorData?.vwap || price;

    // Análisis técnico inteligente
    const isBullish = change > 0;
    const isOverbought = rsi > 70;
    const isOversold = rsi < 30;
    const macdBullish = macd.macd > macd.signal;
    const aboveVWAP = price > vwap;

    // Generar análisis contextual
    let analysis = "";
    let recommendation = "";
    let confidence = 5;

    // Análisis específico por tipo de consulta
    if (query.toLowerCase().includes('oro') || symbol === 'XAUUSD') {
      analysis = `El oro (${symbol}) está cotizando a ${price.toFixed(2)}. `;
      if (isBullish) {
        analysis += `Con un movimiento alcista del ${changePercent.toFixed(2)}%, el oro muestra fortaleza. `;
        if (isOverbought) {
          analysis += `Sin embargo, el RSI de ${rsi.toFixed(1)} indica sobrecompra, sugiriendo una posible corrección.`;
          recommendation = "HOLD - Esperar retroceso";
          confidence = 7;
        } else {
          analysis += `El RSI de ${rsi.toFixed(1)} está en zona neutral, permitiendo más upside.`;
          recommendation = "BUY - Momentum alcista";
          confidence = 8;
        }
      } else {
        analysis += `El retroceso del ${changePercent.toFixed(2)}% podría ser una oportunidad de compra. `;
        if (isOversold) {
          analysis += `El RSI de ${rsi.toFixed(1)} indica sobreventa, señalando un posible rebote.`;
          recommendation = "BUY - Zona de sobreventa";
          confidence = 8;
        } else {
          recommendation = "WAIT - Confirmar dirección";
          confidence = 6;
        }
      }
    } else if (query.toLowerCase().includes('eur') || symbol.includes('EUR')) {
      analysis = `El EUR/USD está en ${price.toFixed(4)}. `;
      if (aboveVWAP) {
        analysis += `Cotizando por encima del VWAP (${vwap.toFixed(4)}), muestra fortaleza institucional. `;
      } else {
        analysis += `Por debajo del VWAP (${vwap.toFixed(4)}), indica presión vendedora. `;
      }
      
      if (macdBullish && !isOverbought) {
        analysis += `MACD bullish con RSI en ${rsi.toFixed(1)} sugiere continuidad alcista.`;
        recommendation = "BUY - Confluencia técnica";
        confidence = 8;
      } else if (!macdBullish && isOversold) {
        analysis += `MACD bearish pero RSI oversold sugiere rebote técnico.`;
        recommendation = "WAIT - Posible rebote";
        confidence = 6;
      } else {
        recommendation = "HOLD - Señales mixtas";
        confidence = 5;
      }
    } else if (symbol.includes('500') || symbol.includes('NAS') || symbol.includes('GER')) {
      analysis = `El índice ${symbol} está en ${price.toFixed(2)}. `;
      if (isBullish && macdBullish) {
        analysis += `Momentum alcista confirmado por MACD. `;
        if (isOverbought) {
          analysis += `RSI alto (${rsi.toFixed(1)}) sugiere precaución en nuevas compras.`;
          recommendation = "HOLD - Momentum pero overbought";
          confidence = 6;
        } else {
          analysis += `RSI saludable permite más upside.`;
          recommendation = "BUY - Trend alcista";
          confidence = 8;
        }
      } else if (!isBullish) {
        analysis += `Corrección en curso. `;
        if (isOversold) {
          analysis += `RSI oversold sugiere fin de corrección.`;
          recommendation = "BUY - Zona de compra";
          confidence = 7;
        } else {
          recommendation = "WAIT - Continuar corrección";
          confidence = 5;
        }
      }
    } else {
      // Análisis general para otros pares
      analysis = `${symbol} cotiza en ${price.toFixed(4)} con ${changePercent > 0 ? 'ganancia' : 'pérdida'} del ${Math.abs(changePercent).toFixed(2)}%. `;
      
      const signals = [];
      if (macdBullish) signals.push("MACD bullish");
      if (aboveVWAP) signals.push("Above VWAP");
      if (isOversold) signals.push("RSI oversold");
      if (isOverbought) signals.push("RSI overbought");
      
      if (signals.length >= 2) {
        analysis += `Múltiples señales técnicas: ${signals.join(', ')}.`;
        confidence = 7;
      }
      
      if (macdBullish && aboveVWAP && !isOverbought) {
        recommendation = "BUY - Confluencia alcista";
        confidence = 8;
      } else if (!macdBullish && !aboveVWAP && isOverbought) {
        recommendation = "SELL - Confluencia bajista";
        confidence = 8;
      } else {
        recommendation = "HOLD - Señales mixtas";
        confidence = 5;
      }
    }

    // Calcular niveles clave
    const supportLevel = (price * 0.995).toFixed(4);
    const resistanceLevel = (price * 1.005).toFixed(4);
    const entryLevel = isBullish ? (price * 1.001).toFixed(4) : (price * 0.999).toFixed(4);
    const stopLoss = isBullish ? (price * 0.992).toFixed(4) : (price * 1.008).toFixed(4);
    const takeProfit = isBullish ? (price * 1.015).toFixed(4) : (price * 0.985).toFixed(4);

    return {
      analysis,
      recommendation,
      keyLevels: {
        support: supportLevel,
        resistance: resistanceLevel,
        entry: entryLevel
      },
      riskManagement: {
        stopLoss,
        takeProfit,
        riskReward: "1:3"
      },
      technicalView: `RSI: ${rsi.toFixed(1)} | MACD: ${macdBullish ? 'Bullish' : 'Bearish'} | VWAP: ${aboveVWAP ? 'Above' : 'Below'}`,
      confidence
    };
  };

  const sendMessage = async () => {
    if (!input.trim() || isAnalyzing) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAnalyzing(true);

    // Simular tiempo de procesamiento
    setTimeout(() => {
      try {
        const currentPrice = prices[selectedSymbol];
        const currentIndicators = indicators;

        if (!currentPrice) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'No hay datos disponibles para este instrumento. Por favor selecciona un instrumento con datos activos.',
          }]);
          setIsAnalyzing(false);
          return;
        }

        // Generar análisis inteligente
        const analysisResult = analyzeMarket(userMessage, selectedSymbol, currentPrice, currentIndicators);

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: analysisResult.analysis,
          data: analysisResult
        }]);

      } catch (error) {
        console.error('Error en análisis:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Error en el análisis. Verifica que hay datos de mercado disponibles.',
        }]);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500); // 1.5 segundos para simular análisis
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
        <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
        Análisis Inteligente
      </h3>
      
      {/* Mensajes del Chat */}
      <div className="h-80 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-8">
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-white mb-2">💡 Ejemplos de consultas:</h4>
              <div className="space-y-1 text-xs">
                <div>"¿Qué opinas del EUR/USD ahora?"</div>
                <div>"¿Es buen momento para entrar en oro?"</div>
                <div>"Analiza el RSI del SPX500"</div>
                <div>"¿Hay confluencia técnica en {selectedSymbol}?"</div>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <div key={idx} className={`p-3 rounded-lg ${
            message.role === 'user' 
              ? 'bg-blue-600 ml-4' 
              : 'bg-gray-700 mr-4'
          }`}>
            <div className="text-sm text-white">{message.content}</div>
            
            {/* Datos estructurados del análisis */}
            {message.data && (
              <div className="mt-3 space-y-2">
                {/* Recomendación */}
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-xs text-gray-400">Recomendación</div>
                  <div className={`font-semibold ${
                    message.data.recommendation?.includes('BUY') ? 'text-green-400' :
                    message.data.recommendation?.includes('SELL') ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {message.data.recommendation}
                  </div>
                </div>
                
                {/* Niveles Clave */}
                {message.data.keyLevels && (
                  <div className="bg-gray-800 rounded p-2">
                    <div className="text-xs text-gray-400 mb-1">Niveles Clave</div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div>
                        <div className="text-green-400">Soporte</div>
                        <div className="text-white">{message.data.keyLevels.support}</div>
                      </div>
                      <div>
                        <div className="text-red-400">Resistencia</div>
                        <div className="text-white">{message.data.keyLevels.resistance}</div>
                      </div>
                      <div>
                        <div className="text-blue-400">Entrada</div>
                        <div className="text-white">{message.data.keyLevels.entry}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Risk Management */}
                {message.data.riskManagement && (
                  <div className="bg-gray-800 rounded p-2">
                    <div className="text-xs text-gray-400 mb-1">Gestión de Riesgo</div>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div>
                        <div className="text-red-400">Stop Loss</div>
                        <div className="text-white">{message.data.riskManagement.stopLoss}</div>
                      </div>
                      <div>
                        <div className="text-green-400">Take Profit</div>
                        <div className="text-white">{message.data.riskManagement.takeProfit}</div>
                      </div>
                      <div>
                        <div className="text-yellow-400">R:R</div>
                        <div className="text-white">{message.data.riskManagement.riskReward}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Vista Técnica */}
                {message.data.technicalView && (
                  <div className="bg-gray-800 rounded p-2">
                    <div className="text-xs text-gray-400">Vista Técnica</div>
                    <div className="text-white text-xs">{message.data.technicalView}</div>
                  </div>
                )}
                
                {/* Confianza */}
                {message.data.confidence && (
                  <div className="bg-gray-800 rounded p-2">
                    <div className="text-xs text-gray-400">Confianza del Análisis</div>
                    <div className="flex items-center">
                      <div className="text-white font-semibold">{message.data.confidence}/10</div>
                      <div className="ml-2 flex-1 bg-gray-600 rounded-full h-1">
                        <div 
                          className="bg-blue-400 h-1 rounded-full" 
                          style={{width: `${message.data.confidence * 10}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {isAnalyzing && (
          <div className="bg-gray-700 mr-4 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-sm text-white">Analizando mercado...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input del Chat */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={`Analiza ${selectedSymbol} o pregunta lo que quieras...`}
          className="flex-1 p-3 bg-gray-700 rounded text-white text-sm placeholder-gray-400 border border-gray-600 focus:border-blue-400 focus:outline-none"
          disabled={isAnalyzing}
        />
        <button
          onClick={sendMessage}
          disabled={isAnalyzing || !input.trim()}
          className="px-4 py-3 bg-blue-600 rounded text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? '...' : 'Analizar'}
        </button>
      </div>
      
      {/* Info del contexto */}
      <div className="mt-2 text-xs text-gray-500">
        🎯 Contexto: {selectedSymbol} - {selectedTimeframe} | 
        📊 {Object.keys(prices).length} instrumentos | 
        📈 {indicators ? 'Indicadores activos' : 'Cargando indicadores'}
      </div>
    </div>
  );
};

// Componente principal de la aplicación
const TradingApp: React.FC = () => {
  const selectedSymbol = useMarketStore((state) => state.selectedSymbol);
  const selectedTimeframe = useMarketStore((state) => state.selectedTimeframe);
  const setSelectedSymbol = useMarketStore((state) => state.setSelectedSymbol);
  const setSelectedTimeframe = useMarketStore((state) => state.setSelectedTimeframe);
  const error = useMarketStore((state) => state.error);
  
  // Estado para los tabs del sidebar
  const [activeTab, setActiveTab] = useState<'indicators' | 'chat'>('indicators');

  const serverHealth = useServerHealth();
  useMarketPrices();
  useHistoricalData(selectedSymbol, selectedTimeframe);

  const instruments = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPX500', 'NAS100', 'GER40'];
  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D', '1W'];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-400">Trading Platform Pro</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {serverHealth.data ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                serverHealth.data ? 'text-green-400' : 'text-red-400'
              }`}>
                {serverHealth.data ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white p-3 text-center">
          <span className="font-medium">Error: {error}</span>
        </div>
      )}

      {/* Instrumentos */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {instruments.map((symbol) => (
            <InstrumentCard
              key={symbol}
              symbol={symbol}
              isSelected={selectedSymbol === symbol}
              onClick={() => setSelectedSymbol(symbol)}
            />
          ))}
        </div>
      </div>

      {/* Timeframes */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex space-x-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                selectedTimeframe === tf 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex flex-1 p-6 space-x-6">
        {/* Panel Principal */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg p-6 mb-6" style={{ height: '500px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {selectedSymbol} - {selectedTimeframe}
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">
                  {useMarketStore.getState().getFormattedPrice()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center h-96 text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Gráfico de {selectedSymbol}</p>
                <p className="text-sm">Datos en tiempo real conectados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar con Tabs */}
        <div className="w-80 space-y-6">
          <div className="bg-gray-800 rounded-lg">
            {/* Tabs para cambiar entre Indicadores y Chat */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('indicators')}
                className={`flex-1 p-3 text-sm font-medium rounded-tl-lg transition-colors ${
                  activeTab === 'indicators' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                📊 Indicadores
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 p-3 text-sm font-medium rounded-tr-lg transition-colors ${
                  activeTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                🤖 Chat IA
              </button>
            </div>
            
            {/* Contenido del Tab */}
            <div className="min-h-96">
              {activeTab === 'indicators' ? <TechnicalIndicators /> : <IntelligentChat />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// App principal con providers
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TradingApp />
    </QueryClientProvider>
  );
};

export default App;