// backend/src/services/multiAIService.ts - COORDINADOR MULTI-IA
import ClaudeAnalysisService from './claudeService';
import DeepSeekService from './deepseekService';

interface AnalysisRequest {
  query: string;
  symbol: string;
  marketData: any;
  indicators?: any;
  preferredProvider?: 'claude' | 'deepseek' | 'both' | 'auto';
  compareResults?: boolean;
}

interface MultiAIAnalysis {
  primary: any;
  secondary?: any;
  comparison?: {
    agreement: number;
    recommendationMatch: boolean;
    confidenceDiff: number;
    summary: string;
  };
  provider: string;
  fallbackUsed: boolean;
  processingTime: number;
}

type AIProvider = 'claude' | 'deepseek' | 'local';

class MultiAIAnalysisService {
  private claudeService: ClaudeAnalysisService;
  private deepSeekService: DeepSeekService;
  private providerPriority: AIProvider[] = ['claude', 'deepseek', 'local'];

  constructor() {
    this.claudeService = new ClaudeAnalysisService();
    this.deepSeekService = new DeepSeekService();
    
    console.log('🚀 Multi-AI Analysis Service initialized');
    this.logAvailableProviders();
  }

  async analyzeMarket(request: AnalysisRequest): Promise<MultiAIAnalysis> {
    const startTime = Date.now();
    const preferredProvider = request.preferredProvider || 'auto';
    
    console.log(`🧠 Multi-AI analysis for ${request.symbol}: "${request.query}" (provider: ${preferredProvider})`);

    try {
      if (preferredProvider === 'both' || request.compareResults) {
        return await this.runComparativeAnalysis(request, startTime);
      } else {
        return await this.runSingleAnalysis(request, preferredProvider, startTime);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Multi-AI analysis failed:', error.message);
      } else {
        console.error('❌ Multi-AI analysis failed:', error);
      }
      throw error;
    }
  }

  private async runSingleAnalysis(
    request: AnalysisRequest, 
    preferredProvider: string, 
    startTime: number
  ): Promise<MultiAIAnalysis> {
    
    const providers = this.getProviderOrder(preferredProvider);
    let lastError: Error | null = null;
    let fallbackUsed = false;

    for (const [index, provider] of providers.entries()) {
      try {
        console.log(`🔄 Trying ${provider} for analysis...`);
        
        const result = await this.callProvider(provider, request);
        const processingTime = Date.now() - startTime;
        
        if (index > 0) {
          fallbackUsed = true;
          console.log(`✅ Successfully used fallback provider: ${provider}`);
        }

        return {
          primary: result,
          provider: provider,
          fallbackUsed,
          processingTime,
          comparison: undefined,
          secondary: undefined
        };

      } catch (error) {
        lastError = error as Error;
        console.log(`⚠️  ${provider} failed: ${(error as Error).message}`);
        continue;
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  private async runComparativeAnalysis(
    request: AnalysisRequest, 
    startTime: number
  ): Promise<MultiAIAnalysis> {
    
    console.log('🔍 Running comparative analysis with multiple AI providers...');

    const results = await Promise.allSettled([
      this.callProvider('claude', request).catch(err => ({ error: err.message, provider: 'claude' })),
      this.callProvider('deepseek', request).catch(err => ({ error: err.message, provider: 'deepseek' }))
    ]);

    const claudeResult = results[0];
    const deepSeekResult = results[1];

    let primary, secondary, comparison;

    // Determinar resultado primario y secundario
    if (claudeResult.status === 'fulfilled' && !claudeResult.value.error) {
      primary = claudeResult.value;
      if (deepSeekResult.status === 'fulfilled' && !deepSeekResult.value.error) {
        secondary = deepSeekResult.value;
        comparison = this.compareAnalyses(primary, secondary);
      }
    } else if (deepSeekResult.status === 'fulfilled' && !deepSeekResult.value.error) {
      primary = deepSeekResult.value;
    } else {
      // Ambos fallaron, usar análisis local
      console.log('🔄 Both AI providers failed, using enhanced local analysis');
      primary = await this.callProvider('local', request);
    }

    if (!primary) {
      throw new Error('All analysis providers failed');
    }

    const processingTime = Date.now() - startTime;

    return {
      primary,
      secondary,
      comparison,
      provider: comparison ? 'claude+deepseek' : primary.source || 'unknown',
      fallbackUsed: !comparison,
      processingTime
    };
  }

  private async callProvider(provider: AIProvider, request: AnalysisRequest): Promise<any> {
    switch (provider) {
      case 'claude':
        return await this.claudeService.analyzeMarket(request);
      
      case 'deepseek':
        return await this.deepSeekService.analyzeMarket(request);
      
      case 'local':
        // Usar el análisis local mejorado de Claude service
        return await this.claudeService.analyzeMarket(request);
      
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private getProviderOrder(preferredProvider: string): AIProvider[] {
    switch (preferredProvider) {
      case 'claude':
        return ['claude', 'deepseek', 'local'];
      case 'deepseek':
        return ['deepseek', 'claude', 'local'];
      case 'auto':
      default:
        return this.providerPriority;
    }
  }

  private compareAnalyses(claude: any, deepseek: any) {
    try {
      // Comparar recomendaciones
      const claudeRec = claude.recommendation?.toLowerCase() || '';
      const deepseekRec = deepseek.recommendation?.toLowerCase() || '';
      
      const recommendationMatch = 
        (claudeRec.includes('buy') && deepseekRec.includes('buy')) ||
        (claudeRec.includes('sell') && deepseekRec.includes('sell')) ||
        (claudeRec.includes('hold') && deepseekRec.includes('hold'));

      // Comparar confianza
      const claudeConfidence = claude.confidence || 5;
      const deepseekConfidence = deepseek.confidence || 5;
      const confidenceDiff = Math.abs(claudeConfidence - deepseekConfidence);

      // Calcular nivel de acuerdo (0-100)
      let agreement = 0;
      if (recommendationMatch) agreement += 50;
      if (confidenceDiff <= 2) agreement += 25;
      if (confidenceDiff <= 1) agreement += 15;
      if (Math.abs(parseFloat(claude.keyLevels?.entry || '0') - parseFloat(deepseek.keyLevels?.entry || '0')) < 0.01) {
        agreement += 10;
      }

      let summary = '';
      if (agreement >= 80) {
        summary = 'Alto consenso entre modelos de IA - Análisis muy confiable';
      } else if (agreement >= 60) {
        summary = 'Consenso moderado - Análisis confiable con algunas diferencias menores';
      } else if (agreement >= 40) {
        summary = 'Consenso parcial - Revisar análisis cuidadosamente';
      } else {
        summary = 'Bajo consenso - Modelos difieren significativamente, se recomienda análisis adicional';
      }

      return {
        agreement,
        recommendationMatch,
        confidenceDiff,
        summary,
        details: {
          claude: {
            recommendation: claudeRec,
            confidence: claudeConfidence,
            source: claude.source
          },
          deepseek: {
            recommendation: deepseekRec,
            confidence: deepseekConfidence,
            source: deepseek.source
          }
        }
      };

    } catch (error) {
      console.error('Error comparing analyses:', error);
      return {
        agreement: 0,
        recommendationMatch: false,
        confidenceDiff: 10,
        summary: 'Error al comparar análisis',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  // Test de todos los proveedores
  async testAllProviders(): Promise<Record<string, any>> {
    console.log('🧪 Testing all AI providers...');

    const claudeTest = this.claudeService.testConnection().catch(err => ({ error: err.message }));
    const deepseekTest = this.deepSeekService.testConnection().catch(err => ({ error: err.message }));

    const [claudeResult, deepseekResult] = await Promise.allSettled([claudeTest, deepseekTest]);

    return {
      claude: {
        available: claudeResult.status === 'fulfilled' && claudeResult.value === true,
        error: claudeResult.status === 'rejected' ? claudeResult.reason : null
      },
      deepseek: {
        available: deepseekResult.status === 'fulfilled' && deepseekResult.value === true,
        error: deepseekResult.status === 'rejected' ? deepseekResult.reason : null
      },
      local: {
        available: true,
        description: 'Enhanced local analysis always available'
      },
      timestamp: new Date().toISOString()
    };
  }

  // Obtener información de proveedores
  getProvidersInfo() {
    return {
      claude: {
        available: !!process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-sonnet-20240229',
        description: 'Advanced reasoning and financial analysis'
      },
      deepseek: this.deepSeekService.getModelInfo(),
      local: {
        available: true,
        description: 'Enhanced local analysis with real market data',
        features: ['Technical analysis', 'Risk management', 'Market context']
      },
      strategy: {
        default: 'Auto-select best available provider',
        fallback: 'Automatic fallback to next available provider',
        comparison: 'Optional dual-provider analysis for high confidence'
      }
    };
  }

  private async logAvailableProviders() {
    try {
      const status = await this.testAllProviders();
      console.log('🤖 AI Providers Status:');
      console.log(`   Claude: ${status.claude.available ? '✅ Available' : '❌ Unavailable'}`);
      console.log(`   DeepSeek: ${status.deepseek.available ? '✅ Available' : '❌ Unavailable'}`);
      console.log(`   Local Analysis: ✅ Always Available`);
    } catch (error) {
      console.log('⚠️  Could not test all providers on startup');
    }
  }

  // Configurar prioridad de proveedores
  setProviderPriority(priority: AIProvider[]) {
    this.providerPriority = priority;
    console.log(`🔄 Provider priority updated: ${priority.join(' → ')}`);
  }

  // Obtener estadísticas de uso
  getUsageStats() {
    return {
      availableProviders: this.providerPriority.length,
      primaryProvider: this.providerPriority[0],
      fallbackChain: this.providerPriority.slice(1),
      capabilities: [
        'Comparative analysis',
        'Automatic failover',
        'Real-time market data integration',
        'Technical indicators analysis',
        'Risk management calculations'
      ]
    };
  }
}

export default MultiAIAnalysisService;