import { useQuery } from "@tanstack/react-query";
import {
  fetchStockQuote,
  fetchDailyCandles,
  fetchIntradayCandles,
  fetchBatchQuotes,
  generatePrediction,
  type StockQuote,
  type BatchQuote,
} from "@/lib/marketDataService";
import { topStocks, generateCandlestickData } from "@/lib/mockData";

const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'META', 'AMZN', 'JPM'];

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: ['stock-quote', symbol],
    queryFn: () => fetchStockQuote(symbol),
    refetchInterval: 30000, // 30s
    staleTime: 15000,
    retry: 1,
  });
}

export function useDailyCandles(symbol: string) {
  return useQuery({
    queryKey: ['daily-candles', symbol],
    queryFn: async () => {
      const data = await fetchDailyCandles(symbol);
      if (data.length > 0) return data;
      // Fallback to mock
      return generateCandlestickData(100).map(d => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      }));
    },
    staleTime: 60000,
    retry: 1,
  });
}

export function useIntradayCandles(symbol: string) {
  return useQuery({
    queryKey: ['intraday-candles', symbol],
    queryFn: async () => {
      const data = await fetchIntradayCandles(symbol);
      if (data.length > 0) return data;
      return generateCandlestickData(1).map(d => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      }));
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
  });
}

export interface EnrichedStock {
  ticker: string;
  name: string;
  price: number;
  predicted: number;
  confidence: number;
  trend: 'bullish' | 'bearish';
  change: number;
}

const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft',
  GOOGL: 'Alphabet',
  NVDA: 'NVIDIA',
  TSLA: 'Tesla',
  META: 'Meta',
  AMZN: 'Amazon',
  JPM: 'JPMorgan',
};

export function useTopStocks() {
  return useQuery<EnrichedStock[]>({
    queryKey: ['top-stocks-batch'],
    queryFn: async () => {
      const quotes = await fetchBatchQuotes(STOCK_SYMBOLS);
      if (quotes.length > 0) {
        return quotes.map((q) => {
          const pred = generatePrediction(q.price);
          return {
            ticker: q.ticker,
            name: STOCK_NAMES[q.ticker] || q.ticker,
            price: q.price,
            predicted: pred.predicted,
            confidence: pred.confidence,
            trend: pred.trend,
            change: q.change,
          };
        });
      }
      // Fallback to mock data
      return topStocks;
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 1,
  });
}

export function useMetrics(symbol: string = 'AAPL') {
  return useQuery({
    queryKey: ['metrics', symbol],
    queryFn: async () => {
      const quote = await fetchStockQuote(symbol);
      if (quote) {
        const pred = generatePrediction(quote.price);
        return {
          currentPrice: quote.price,
          predictedPrice: pred.predicted,
          confidence: pred.confidence,
          trend: pred.trend,
          changePercent: quote.changePercent,
          ticker: quote.ticker,
          isLive: true,
        };
      }
      // Mock fallback
      return {
        currentPrice: 182.40,
        predictedPrice: 186.80,
        confidence: 94,
        trend: 'bullish' as const,
        changePercent: 2.41,
        ticker: 'AAPL',
        isLive: false,
      };
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
  });
}
