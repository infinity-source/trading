// backend/src/services/deepseekService.ts - NUEVO SERVICIO DEEPSEEK
import axios from 'axios';

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

class DeepSeekService {
  private apiKey: string;
  private baseURL: string = 'https://api.deepseek.com/v1';
  private model: string = 'deepseek-chat';
  private fallbackEnabled: boolean = true;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️  DEEPSEEK_API_KEY not found, DeepSeek analysis disabled');
      this.fallbackEnabled = true;
    } else {
      this.fallbackEnabled = false;
      console.log('🧠 DeepSeek API initialized successfully');
    }
  }

  async analyzeMarket(request: AnalysisRequest): Promise<AnalysisResponse> {
    console.log(`🔬 DeepSeek analyzing ${request.symbol}: "${request.query}"`);

    if (this.fallbackEnabled || !this.apiKey) {
      throw new Error('DeepSeek API not available - no API key');
    }

    try {
      const response = await this.callDeepSeekAPI(request);
      console.log(`✅ DeepSeek analysis completed for ${request.symbol}`);
      return response;
      
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ DeepSeek API error:`, error.message);
      } else {
        console.error(`❌ DeepSeek API error:`, String(error));
      }
      throw error;
    }
  }

  private async callDeepSeekAPI(request: AnalysisRequest): Promise<AnalysisResponse> {
    const { query, symbol, marketData, indicators } = request;

    const prompt = this.buildAnalysisPrompt(query, symbol, marketData, indicators);

    const payload = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: `Eres un analista financiero experto especializado en mercados forex, índices y materias primas. Tienes experiencia en análisis técnico y fundamental. Respondes en español con análisis detallados y recomendaciones específicas.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
      stream: false
    };

    const response = await axios.post(`${this.baseURL}/chat/completions`, payload, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const responseText = response.data.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(responseText);
      return {
        ...parsedResponse,
        source: "deepseek-api",
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error('Error parsing DeepSeek response:', parseError);
      throw new Error('Invalid JSON response from DeepSeek');
    }
  }

  private buildAnalysisPrompt(query: string, symbol: string, marketData: any, indicators: any): string {
    return `
ANÁLISIS DE MERCADO FINANCIERO - DEEPSEEK AI

DATOS DE MERCADO EN TIEMPO REAL:
- Símbolo: ${symbol}
- Precio actual: ${marketData.price}
- Cambio: ${marketData.change} (${marketData.changePercent}%)
- Máximo 24h: ${marketData.high24h}
- Mínimo 24h: ${marketData.low24h}
- Volumen: ${marketData.volume || 'N/A'}
- Timestamp: ${new Date(marketData.timestamp).toISOString()}

INDICADORES TÉCNICOS:
${indicators ? `
- RSI (14): ${indicators.rsi}
- MACD: ${indicators.macd?.macd} / Signal: ${indicators.macd?.signal} / Histogram: ${indicators.macd?.histogram}
- VWAP: ${indicators.vwap}
` : 'Indicadores técnicos no disponibles en este momento'}

CONSULTA DEL TRADER: "${query}"

CONTEXTO DE MERCADO:
- Fecha y hora UTC: ${new Date().toISOString()}
- Sesión de mercado: ${this.getCurrentMarketSession()}
- Volatilidad del activo: ${this.getVolatilityLevel(marketData.changePercent)}

INSTRUCCIONES ESPECÍFICAS:
1. Analiza la consulta específica del trader sobre ${symbol}
2. Considera todos los datos técnicos y de mercado proporcionados
3. Evalúa la tendencia actual y momentum del precio
4. Identifica niveles técnicos clave (soporte/resistencia)
5. Proporciona una recomendación clara: BUY/SELL/HOLD
6. Calcula stop loss y take profit con base en volatilidad
7. Identifica 3 factores clave que podrían afectar el precio
8. Evalúa la confianza del análisis (1-10)

FORMATO DE RESPUESTA REQUERIDO:
Responde ÚNICAMENTE en formato JSON válido:

{
  "analysis": "Análisis detallado considerando la consulta específica del trader, datos técnicos actuales, y contexto de mercado. Mínimo 100 palabras.",
  "recommendation": "BUY/SELL/HOLD con razón específica y clara",
  "confidence": número_entero_del_1_al_10,
  "keyLevels": {
    "support": "nivel_soporte_más_cercano",
    "resistance": "nivel_resistencia_más_cercano",
    "entry": "precio_entrada_recomendado"
  },
  "riskManagement": {
    "stopLoss": "nivel_stop_loss_calculado",
    "takeProfit": "nivel_take_profit_calculado",
    "riskReward": "ratio_riesgo_recompensa_como_1:X"
  },
  "technicalView": "Resumen conciso de la situación técnica actual",
  "catalysts": ["factor_1", "factor_2", "factor_3"],
  "timeframe": "horizonte_temporal_recomendado_para_la_operación"
}

IMPORTANTE: 
- Responde SOLO con JSON válido, sin texto adicional
- Todos los valores numéricos en los niveles deben ser precisos
- Las recomendaciones deben ser específicas para la consulta
- Considera que el trader busca información práctica y accionable
    `;
  }

  private getCurrentMarketSession(): string {
    const hour = new Date().getUTCHours();
    if (hour >= 22 || hour < 6) return "Sesión de Sydney";
    if (hour >= 6 && hour < 8) return "Sesión de Tokyo";
    if (hour >= 8 && hour < 16) return "Sesión de Londres";
    if (hour >= 16 && hour < 22) return "Sesión de Nueva York";
    return "Transición entre sesiones";
  }

  private getVolatilityLevel(changePercent: number): string {
    const absChange = Math.abs(changePercent);
    if (absChange > 2) return "Muy Alta";
    if (absChange > 1) return "Alta";
    if (absChange > 0.5) return "Media-Alta";
    if (absChange > 0.2) return "Media";
    return "Baja";
  }

  // Test de conexión con DeepSeek
  async testConnection(): Promise<boolean> {
    if (this.fallbackEnabled) {
      return false;
    }

    try {
      const payload = {
        model: this.model,
        messages: [
          {
            role: "user",
            content: "Test connection. Respond only with: OK"
          }
        ],
        max_tokens: 10,
        temperature: 0
      };

      const response = await axios.post(`${this.baseURL}/chat/completions`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return response.data?.choices?.[0]?.message?.content?.includes('OK') || false;
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ DeepSeek connection test failed:', error.message);
      } else {
        console.error('❌ DeepSeek connection test failed:', error);
      }
      return false;
    }
  }

  // Información del modelo
  getModelInfo() {
    return {
      provider: 'DeepSeek',
      model: this.model,
      baseURL: this.baseURL,
      available: !this.fallbackEnabled,
      capabilities: [
        'Financial market analysis',
        'Technical analysis',
        'Risk management calculations',
        'Multi-language support',
        'Real-time data processing'
      ]
    };
  }
}

export default DeepSeekService;