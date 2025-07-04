// backend/src/services/claudeService.ts - ANÁLISIS REAL CON CLAUDE
import Anthropic from '@anthropic-ai/sdk';

interface AnalysisRequest {
  query: string;
  symbol: string;
  marketData: any;
  indicators?: any;
}

interface AnalysisResponse {
  analysis: string;
  recommendation: string;
  confidence: number;
  keyLevels: {
    support: string;
    resistance: string;
    entry: string;
  };
  riskManagement: {
    stopLoss: string;
    takeProfit: string;
    riskReward: string;
  };
  technicalView: string;
  catalysts: string[];
  timeframe: string;
  source: string;
}

class ClaudeAnalysisService {
  private anthropic?: Anthropic;
  private fallbackEnabled: boolean = true;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not found, using fallback analysis');
      this.fallbackEnabled = true;
    } else {
      this.anthropic = new Anthropic({
        apiKey: apiKey
      });
      this.fallbackEnabled = false;
      console.log('🤖 Claude API initialized successfully');
    }
  }

  async analyzeMarket(request: AnalysisRequest): Promise<AnalysisResponse> {
    console.log(`🧠 Analyzing ${request.symbol}: "${request.query}"`);

    // Si no hay API key, usar análisis local mejorado
    if (this.fallbackEnabled || !this.anthropic) {
      console.log('📊 Using enhanced local analysis');
      return this.enhancedLocalAnalysis(request);
    }

    try {
      // Análisis real con Claude
      const claudeResponse = await this.callClaudeAPI(request);
      console.log(`✅ Claude analysis completed for ${request.symbol}`);
      return claudeResponse;
      
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Claude API error:`, error.message);
      } else {
        console.error(`❌ Claude API error:`, error);
      }
      console.log('🔄 Falling back to local analysis');
      return this.enhancedLocalAnalysis(request);
    }
  }

  private async callClaudeAPI(request: AnalysisRequest): Promise<AnalysisResponse> {
    const { query, symbol, marketData, indicators } = request;

    const prompt = `
Eres un analista financiero experto especializado en mercados forex, índices y materias primas. 

DATOS DE MERCADO EN TIEMPO REAL:
- Símbolo: ${symbol}
- Precio actual: ${marketData.price}
- Cambio: ${marketData.change} (${marketData.changePercent}%)
- High 24h: ${marketData.high24h}
- Low 24h: ${marketData.low24h}
- Timestamp: ${new Date(marketData.timestamp).toISOString()}

INDICADORES TÉCNICOS:
${indicators ? `
- RSI: ${indicators.rsi}
- MACD: ${indicators.macd?.macd} / Signal: ${indicators.macd?.signal}
- VWAP: ${indicators.vwap}
` : 'Indicadores no disponibles'}

CONSULTA DEL TRADER: "${query}"

CONTEXTO ADICIONAL:
- Es ${new Date().toLocaleString('es-ES', { timeZone: 'UTC' })} UTC
- Mercado: ${this.getMarketSession()}
- Volatilidad esperada: ${this.getVolatilityContext(marketData)}

INSTRUCCIONES:
1. Analiza la consulta específica del trader
2. Considera el contexto de mercado actual
3. Proporciona análisis técnico y fundamental
4. Incluye niveles de soporte/resistencia específicos
5. Da recomendación clara: BUY/SELL/HOLD con razón específica
6. Calcula niveles de stop loss y take profit realistas
7. Evalúa factores de riesgo actuales

RESPONDE ÚNICAMENTE EN FORMATO JSON VÁLIDO:
{
  "analysis": "Análisis detallado en español considerando la consulta específica",
  "recommendation": "BUY/SELL/HOLD con razón específica",
  "confidence": número_del_1_al_10,
  "keyLevels": {
    "support": "nivel_soporte_específico",
    "resistance": "nivel_resistencia_específico",
    "entry": "punto_entrada_recomendado"
  },
  "riskManagement": {
    "stopLoss": "nivel_stop_loss",
    "takeProfit": "nivel_take_profit",
    "riskReward": "ratio_como_1:2"
  },
  "technicalView": "Resumen de indicadores técnicos",
  "catalysts": ["factor1", "factor2", "factor3"],
  "timeframe": "horizonte_temporal_recomendado"
}

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional ni comentarios.
    `;

    const message = await this.anthropic!.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      temperature: 0.1, // Más determinístico para análisis financiero
      messages: [{ 
        role: "user", 
        content: prompt 
      }]
    });

    // Find the first content block of type 'text'
    const textBlock = message.content.find((block: any) => block.type === 'text');
    const responseText = (textBlock && textBlock.type === 'text') ? (textBlock as { text: string }).text : '';

    try {
      const parsedResponse = JSON.parse(responseText);
      return {
        ...parsedResponse,
        source: "claude-api",
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      throw new Error('Invalid JSON response from Claude');
    }
  }

  private enhancedLocalAnalysis(request: AnalysisRequest): AnalysisResponse {
    const { query, symbol, marketData } = request;
    const price = marketData.price;
    const changePercent = marketData.changePercent;

    // Análisis contextual avanzado
    let analysis = "";
    let recommendation = "";
    let confidence = 5;
    let catalysts: string[] = [];

    const queryLower = query.toLowerCase();
    const isPositive = changePercent > 0;

    // Análisis específico por activo
    if (symbol === 'XAUUSD' || queryLower.includes('oro')) {
      analysis = `El oro cotiza en $${price.toFixed(2)} con ${isPositive ? 'ganancia' : 'pérdida'} del ${Math.abs(changePercent).toFixed(2)}%. `;
      
      if (Math.abs(changePercent) > 0.5) {
        analysis += `El movimiento significativo del ${Math.abs(changePercent).toFixed(2)}% indica actividad institucional fuerte. `;
        catalysts = ["Política Fed", "Tensiones geopolíticas", "Inflación USD"];
        confidence = 7;
      }
      
      if (changePercent > 0.3) {
        analysis += `La fortaleza del oro sugiere búsqueda de refugio seguro o debilidad del USD.`;
        recommendation = "BUY - Safe haven demand";
      } else if (changePercent < -0.3) {
        analysis += `La debilidad del oro indica apetito por riesgo o fortaleza del USD.`;
        recommendation = "SELL - Risk-on sentiment";
      } else {
        recommendation = "HOLD - Consolidación";
      }

    } else if (symbol.includes('USD')) {
      analysis = `${symbol} cotiza en ${price.toFixed(4)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%). `;
      
      if (Math.abs(changePercent) > 0.2) {
        analysis += `Movimiento significativo sugiere flujos de capital institucionales o noticias fundamentales. `;
        catalysts = ["Datos económicos USA", "Política monetaria", "Flujos institucionales"];
        confidence = 6;
        
        if (changePercent > 0.2) {
          analysis += `Fortaleza del USD o debilidad de la contraparte.`;
          recommendation = symbol.startsWith('USD') ? "BUY - USD strength" : "SELL - Counter weakness";
        } else {
          analysis += `Debilidad del USD o fortaleza de la contraparte.`;
          recommendation = symbol.startsWith('USD') ? "SELL - USD weakness" : "BUY - Counter strength";
        }
      } else {
        analysis += `Rango de consolidación típico para esta sesión.`;
        recommendation = "HOLD - Range bound";
        catalysts = ["Esperando datos económicos", "Consolidación técnica"];
      }

    } else if (symbol.includes('500') || symbol.includes('NAS') || symbol.includes('GER')) {
      analysis = `${symbol} en ${price.toFixed(2)} puntos (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%). `;
      
      if (changePercent > 0.3) {
        analysis += `Rally de índices indica sentimiento risk-on en mercados.`;
        recommendation = "BUY - Risk appetite";
        catalysts = ["Earnings positivos", "Optimismo económico", "Liquidez"];
        confidence = 7;
      } else if (changePercent < -0.3) {
        analysis += `Corrección de índices refleja toma de ganancias o preocupaciones.`;
        recommendation = "WAIT - Risk-off";
        catalysts = ["Toma de ganancias", "Preocupaciones macro", "Rotación sectorial"];
        confidence = 6;
      } else {
        analysis += `Consolidación en índices, esperando catalizador direccional.`;
        recommendation = "HOLD - Neutral";
        catalysts = ["Earnings season", "Datos macro", "Política Fed"];
      }
    }

    // Calcular niveles técnicos realistas
    const volatility = Math.abs(changePercent) / 100;
    const supportLevel = (price * (1 - 0.005 - volatility)).toFixed(symbol.includes('JPY') ? 2 : 4);
    const resistanceLevel = (price * (1 + 0.005 + volatility)).toFixed(symbol.includes('JPY') ? 2 : 4);
    const entryLevel = price.toFixed(symbol.includes('JPY') ? 2 : 4);
    
    const multiplier = recommendation.includes('BUY') ? 1 : -1;
    const stopLoss = (price * (1 - multiplier * 0.008)).toFixed(symbol.includes('JPY') ? 2 : 4);
    const takeProfit = (price * (1 + multiplier * 0.02)).toFixed(symbol.includes('JPY') ? 2 : 4);

    return {
      analysis,
      recommendation,
      confidence,
      keyLevels: {
        support: supportLevel,
        resistance: resistanceLevel,
        entry: entryLevel
      },
      riskManagement: {
        stopLoss,
        takeProfit,
        riskReward: "1:2.5"
      },
      technicalView: `Precio: ${price} | Cambio: ${changePercent.toFixed(2)}% | Volumen: ${marketData.volume || 'N/A'}`,
      catalysts,
      timeframe: Math.abs(changePercent) > 0.5 ? "Corto plazo (1-2 días)" : "Mediano plazo (1-2 semanas)",
      source: "enhanced-local-analysis"
    };
  }

  private getMarketSession(): string {
    const hour = new Date().getUTCHours();
    if (hour >= 22 || hour < 6) return "Sydney";
    if (hour >= 6 && hour < 8) return "Tokyo";
    if (hour >= 8 && hour < 16) return "London";
    if (hour >= 16 && hour < 22) return "New York";
    return "Overlap";
  }

  private getVolatilityContext(marketData: any): string {
    const change = Math.abs(marketData.changePercent);
    if (change > 1) return "Alta";
    if (change > 0.5) return "Media-Alta";
    if (change > 0.2) return "Media";
    return "Baja";
  }

  // Test de conexión
  async testConnection(): Promise<boolean> {
    if (this.fallbackEnabled) {
      console.log('📊 Local analysis mode - always available');
      return true;
    }

    try {
      if (!this.anthropic) {
        throw new Error('Anthropic client is not initialized');
      }
      await this.anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 10,
        messages: [{ role: "user", content: "Test" }]
      });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Claude API test failed:', error.message);
      } else {
        console.error('❌ Claude API test failed:', error);
      }
      return false;
    }
  }
}

export default ClaudeAnalysisService;