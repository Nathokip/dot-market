import { useQuery } from "@tanstack/react-query";
import {
  fetchStockQuote,
  fetchDailyCandles,
  fetchIntradayCandles,
  fetchBatchQuotes,
  fetchStockNews,
} from "@/lib/marketDataService";
import { aiPredictionService } from "@/lib/aiPredictionService";
import { getApiBaseUrl } from "@/lib/env";

export const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'META', 'AMZN', 'BTC-USD'];

export const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft',
  GOOGL: 'Alphabet',
  NVDA: 'NVIDIA',
  TSLA: 'Tesla',
  META: 'Meta',
  AMZN: 'Amazon',
  'BTC-USD': 'Bitcoin',
};

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: ['stock-quote', symbol],
    queryFn: () => fetchStockQuote(symbol),
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useDailyCandles(symbol: string) {
  return useQuery({
    queryKey: ['daily-candles', symbol],
    queryFn: () => fetchDailyCandles(symbol),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useIntradayCandles(symbol: string) {
  return useQuery({
    queryKey: ['intraday-candles', symbol],
    queryFn: () => fetchIntradayCandles(symbol),
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export interface AIPrediction {
  predictedPrice: number;
  confidence: number;
  trend: 'bullish' | 'bearish';
  model: string;
}

export function useAIPrediction(symbol: string, currentPrice: number, model: 'lstm' | 'random_forest' = 'lstm') {
  return useQuery<AIPrediction>({
    queryKey: ['ai-prediction', symbol, model],
    queryFn: async () => {
      const result = await aiPredictionService.predict({
        symbol,
        model,
        historical_days: 90,
      });
      
      if (!result) {
        throw new Error('AI prediction failed');
      }

      const trend = result.predicted_price >= currentPrice ? 'bullish' : 'bearish';
      
      return {
        predictedPrice: result.predicted_price,
        confidence: result.confidence,
        trend,
        model: result.model,
      };
    },
    refetchInterval: 120000,
    staleTime: 60000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export interface MarketSentiment {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  confidence: number;
  signal?: string;
}

export function useMarketSentiment(symbol: string) {
  return useQuery<MarketSentiment>({
    queryKey: ['market-sentiment', symbol],
    queryFn: async () => {
      // Pass the symbol to get real price data
      const result = await aiPredictionService.analyzeSentiment(symbol).catch(() => ({ score: 0, confidence: 0.5, signal: 'HOLD' }));

      let sentiment: 'bullish' | 'bearish' | 'neutral';
      if (result.score > 0.05) sentiment = 'bullish';
      else if (result.score < -0.05) sentiment = 'bearish';
      else sentiment = 'neutral';

      return {
        sentiment,
        score: result.score,
        confidence: (result.confidence || 0.5) * 100,
        signal: result.signal
      };
    },
    staleTime: 60000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export interface EnrichedStock {
  ticker: string;
  name: string;
  price: number;
  predicted: number;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  change: number;
}

export function useTopStocks() {
  return useQuery<EnrichedStock[]>({
    queryKey: ['top-stocks-batch'],
    queryFn: async () => {
      const quotes = await fetchBatchQuotes(STOCK_SYMBOLS);
      
      const predictions = await Promise.all(
        quotes.map(async (q) => {
          const pred = await aiPredictionService.predict({
            symbol: q.ticker,
            model: 'lstm',
            historical_days: 90,
          });
          
          if (!pred) {
            return {
              ticker: q.ticker,
              name: STOCK_NAMES[q.ticker] || q.ticker,
              price: q.price,
              predicted: q.price,
              confidence: 50,
              trend: 'neutral' as const,
              change: q.change,
            };
          }

          return {
            ticker: q.ticker,
            name: STOCK_NAMES[q.ticker] || q.ticker,
            price: q.price,
            predicted: pred.predicted_price,
            confidence: pred.confidence,
            trend: pred.predicted_price >= q.price ? 'bullish' as const : 'bearish' as const,
            change: q.change,
          };
        })
      );
      
      return predictions;
    },
    refetchInterval: 120000,
    staleTime: 60000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export interface MetricsData {
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  trend: 'bullish' | 'bearish';
  changePercent: number;
  ticker: string;
  isLive: boolean;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
}

export function useMetrics(symbol: string) {
  return useQuery<MetricsData>({
    queryKey: ['metrics', symbol],
    queryFn: async () => {
      const [quote, prediction, sentiment] = await Promise.all([
        fetchStockQuote(symbol),
        aiPredictionService.predict({ symbol, model: 'lstm', historical_days: 90 }).catch(() => null),
        aiPredictionService.analyzeSentiment(`${symbol} stock market today price ${symbol === 'AAPL' ? 'Apple' : symbol === 'MSFT' ? 'Microsoft' : symbol === 'GOOGL' ? 'Alphabet' : symbol === 'NVDA' ? 'NVIDIA' : symbol === 'TSLA' ? 'Tesla' : symbol === 'META' ? 'Meta' : symbol === 'AMZN' ? 'Amazon' : symbol} financial analysis`).catch(() => null),
      ]);

      if (!quote) {
        throw new Error(`Failed to fetch data for ${symbol}`);
      }

      const predictedPrice = prediction?.predicted_price ?? quote.price;
      const trend = predictedPrice >= quote.price ? 'bullish' : 'bearish';
      
      let sentimentResult: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (sentiment && sentiment.score > 0.1) sentimentResult = 'bullish';
      else if (sentiment && sentiment.score < -0.1) sentimentResult = 'bearish';

      return {
        currentPrice: quote.price,
        predictedPrice,
        confidence: prediction?.confidence ?? 50,
        trend,
        changePercent: quote.changePercent,
        ticker: quote.ticker,
        isLive: true,
        sentiment: sentimentResult,
        sentimentScore: sentiment?.score ?? 0,
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  ema12: number;
  bollingerUpper: number;
  bollingerLower: number;
  volatility: number;
  volume24h: number;
  avgVolume: number;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateMACD(prices: number[]): { value: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = macdLine * 0.8;
  return {
    value: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

function calculateBollingerBands(prices: number[], period: number = 20): { upper: number; lower: number } {
  const sma = calculateSMA(prices, period);
  const stdDev = Math.sqrt(prices.slice(-period).reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period);
  return {
    upper: sma + 2 * stdDev,
    lower: sma - 2 * stdDev,
  };
}

export function useTechnicalIndicators(symbol: string) {
  return useQuery<TechnicalIndicators>({
    queryKey: ['technical-indicators', symbol],
    queryFn: async () => {
      const candles = await fetchDailyCandles(symbol);
      if (candles.length < 50) {
        throw new Error(`Insufficient data for ${symbol}`);
      }
      const closes = candles.map(c => c.close);
      const rsi = calculateRSI(closes);
      const sma20 = calculateSMA(closes, 20);
      const sma50 = calculateSMA(closes, 50);
      const ema12 = calculateEMA(closes, 12);
      const macd = calculateMACD(closes);
      const bollinger = calculateBollingerBands(closes);
      const avgVolume = candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
      
      const returns = closes.slice(1).map((p, i) => Math.log(p / closes[i]));
      const variance = returns.reduce((sum, r) => sum + r * r, 0) / returns.length;
      const volatility = Math.sqrt(variance * 252) * 100;
      
      return {
        rsi,
        macd,
        sma20,
        sma50,
        ema12,
        bollingerUpper: bollinger.upper,
        bollingerLower: bollinger.lower,
        volatility,
        volume24h: candles[candles.length - 1].volume,
        avgVolume,
      };
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 1,
  });
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  ticker: string;
}

export interface SectorData {
  name: string;
  change: number;
}

export function useMarketIndices() {
  return useQuery<MarketIndex[]>({
    queryKey: ['market-indices'],
    queryFn: async () => {
      const indexSymbols = ['SPY', 'QQQ', 'DIA', 'IWM'];
      const quotes = await fetchBatchQuotes(indexSymbols);
      // Map to actual index values (prices are actual, just multiply for index representation)
      const indexMultipliers: Record<string, number> = { SPY: 10, QQQ: 40, DIA: 100, IWM: 10 };
      return quotes.map((q, i) => ({
        name: q.ticker === 'SPY' ? 'S&P 500' : q.ticker === 'QQQ' ? 'NASDAQ' : q.ticker === 'DIA' ? 'DOW' : 'Russell 2000',
        value: (q.price * (indexMultipliers[q.ticker] || 1)),
        change: q.change,
        ticker: q.ticker,
      }));
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useSectorPerformance() {
  return useQuery<SectorData[]>({
    queryKey: ['sector-performance'],
    queryFn: async () => {
      const sectorSymbols = ['XLK', 'XLV', 'XLF', 'XLE', 'XLY', 'XLIT'];
      const quotes = await fetchBatchQuotes(sectorSymbols);
      const sectorNames: Record<string, string> = { XLK: 'Technology', XLV: 'Healthcare', XLF: 'Finance', XLE: 'Energy', XLY: 'Consumer', XLIT: 'Industrial' };
      return quotes.map(q => ({
        name: sectorNames[q.ticker] || q.ticker,
        change: q.change,
      }));
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export interface NewsItem {
  title: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  time: string;
  source: string;
}

export function useMarketNews(symbol?: string) {
  return useQuery<NewsItem[]>({
    queryKey: ['market-news', symbol],
    queryFn: async () => {
      const news = await fetchStockNews(symbol || 'AAPL');
      
      if (!news || news.length === 0) {
        const quotes = await fetchBatchQuotes(symbol ? [symbol] : STOCK_SYMBOLS.slice(0, 4));
        return quotes.slice(0, 4).map((q, i) => ({
          title: `${q.ticker} trading at $${q.price.toFixed(2)} (${q.change >= 0 ? '+' : ''}${q.change.toFixed(2)}%)`,
          sentiment: q.change >= 0 ? 'bullish' as const : 'bearish' as const,
          time: i === 0 ? 'Now' : `${(i + 1) * 15}m ago`,
          source: 'Live Data',
        }));
      }
      
      return news.slice(0, 6).map((item) => ({
        title: item.title,
        sentiment: item.sentiment,
        time: new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: item.source,
      }));
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
  });
}

export interface SystemStatus {
  denoProxy: boolean;
  aiEngine: boolean;
  lastChecked: Date | null;
}

export function useSystemStatus() {
  return useQuery<SystemStatus>({
    queryKey: ['system-status'],
    queryFn: async () => {
      const apiBaseUrl = getApiBaseUrl();
      const [backend, models] = await Promise.all([
        fetch(`${apiBaseUrl}/health`, { method: 'GET' })
          .then(r => r.ok)
          .catch(() => false),
        fetch(`${apiBaseUrl}/api/models`)
          .then(r => r.ok)
          .catch(() => false),
      ]);

      return {
        denoProxy: backend,
        aiEngine: models,
        lastChecked: new Date(),
      };
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export interface ModelDetails {
  name: string;
  type: string;
  accuracy: number;
  status: string;
  epochs?: number;
  trees?: number;
  description: string;
}

export function useModels() {
  return useQuery<{
    prediction_models: string[];
    sentiment_models: string[];
    technical_indicators: string[];
    models: Record<string, ModelDetails>;
    feature_importance: Array<{ name: string; value: number }>;
    accuracy_history: Array<{ day: string; accuracy: number }>;
  }>({
    queryKey: ['models'],
    queryFn: () => aiPredictionService.getModels(),
    refetchInterval: 120000,
    staleTime: 60000,
    retry: 3,
  });
}

export function useBacktest(symbol: string, strategy: string = 'sma_crossover', startDate: string, endDate: string, trigger?: number) {
  return useQuery({
    queryKey: ['backtest', symbol, strategy, startDate, endDate, trigger],
    queryFn: () => aiPredictionService.runBacktest({
      symbol,
      strategy,
      start_date: startDate,
      end_date: endDate,
      initial_capital: 10000,
    }),
    staleTime: 60000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    enabled: true,
  });
}
