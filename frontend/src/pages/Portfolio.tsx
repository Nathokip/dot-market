import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { aiPredictionService } from "@/lib/aiPredictionService";
import { fetchBatchQuotes, fetchStockQuote } from "@/lib/marketDataService";
import {
  createPortfolioTrade,
  getOrCreatePortfolio,
  listPortfolioTrades,
  type PortfolioTrade,
} from "@/lib/portfolioService";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";

interface HoldingRow {
  avgCost: number;
  change: number;
  confidence: number;
  currentPrice: number;
  name: string;
  predicted: number;
  shares: number;
  ticker: string;
}

interface TradeFormState {
  price: string;
  quantity: string;
  side: "BUY" | "SELL";
  symbol: string;
  isFetchingPrice?: boolean;
}

const defaultTradeForm: TradeFormState = {
  price: "",
  quantity: "",
  side: "BUY",
  symbol: "AAPL",
  isFetchingPrice: false,
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildHoldings(trades: PortfolioTrade[]) {
  const grouped = new Map<string, { costBasis: number; shares: number }>();

  for (const trade of trades) {
    const symbol = trade.symbol.toUpperCase();
    const current = grouped.get(symbol) || { costBasis: 0, shares: 0 };

    if (trade.side === "BUY") {
      current.shares += trade.quantity;
      current.costBasis += trade.price * trade.quantity;
    } else {
      const averageCost = current.shares > 0 ? current.costBasis / current.shares : 0;
      const soldShares = Math.min(current.shares, trade.quantity);
      current.shares -= soldShares;
      current.costBasis = Math.max(0, current.costBasis - soldShares * averageCost);
    }

    grouped.set(symbol, current);
  }

  return Array.from(grouped.entries())
    .filter(([, position]) => position.shares > 0)
    .map(([ticker, position]) => ({
      avgCost: position.shares > 0 ? position.costBasis / position.shares : 0,
      shares: position.shares,
      ticker,
    }));
}

const Portfolio = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<PortfolioTrade[]>([]);
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [form, setForm] = useState<TradeFormState>(defaultTradeForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPortfolio() {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const portfolio = await getOrCreatePortfolio(user.id);
      setPortfolioId(portfolio.id);

      const portfolioTrades = await listPortfolioTrades(portfolio.id);
      setTrades(portfolioTrades);

      const baseHoldings = buildHoldings(portfolioTrades);
      if (baseHoldings.length === 0) {
        setHoldings([]);
        setIsLoading(false);
        return;
      }

      const [quotes, predictions] = await Promise.all([
        fetchBatchQuotes(baseHoldings.map((holding) => holding.ticker)),
        Promise.all(
          baseHoldings.map((holding) =>
            aiPredictionService.predict({
              historical_days: 90,
              model: "lstm",
              symbol: holding.ticker,
            }).catch(() => null),
          ),
        ),
      ]);

      const quoteMap = new Map(quotes.map((quote) => [quote.ticker, quote]));
      const enriched = baseHoldings.map((holding, index) => {
        const quote = quoteMap.get(holding.ticker);
        const prediction = predictions[index];
        return {
          avgCost: holding.avgCost,
          change: quote?.change ?? 0,
          confidence: prediction?.confidence ?? 50,
          currentPrice: quote?.price ?? holding.avgCost,
          name: holding.ticker,
          predicted: prediction?.predicted_price ?? quote?.price ?? holding.avgCost,
          shares: holding.shares,
          ticker: holding.ticker,
        };
      });

      setHoldings(enriched);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load portfolio";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPortfolio();
  }, [user?.id]);

  async function fetchCurrentPrice(symbol: string) {
    if (!symbol || symbol.length < 2) return;
    
    setForm((current) => ({ ...current, isFetchingPrice: true }));
    
    try {
      const quote = await fetchStockQuote(symbol.toUpperCase());
      
      if (quote?.price) {
        setForm((current) => ({ ...current, price: quote.price.toFixed(2), isFetchingPrice: false }));
        toast.success(`Price: $${quote.price.toFixed(2)}`);
      } else {
        setForm((current) => ({ ...current, isFetchingPrice: false }));
        toast.error("Could not fetch price. Enter manually.");
      }
    } catch (e) {
      setForm((current) => ({ ...current, isFetchingPrice: false }));
      console.error("Failed to fetch price:", e);
      toast.error("Could not fetch price. Enter manually.");
    }
  }

  async function handleTradeSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!user || !portfolioId) {
      toast.error("Portfolio is not ready yet.");
      return;
    }

    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (!form.symbol || quantity <= 0 || price <= 0) {
      toast.error("Enter a valid symbol, quantity, and price.");
      return;
    }

    setIsSaving(true);

    try {
      await createPortfolioTrade({
        portfolioId,
        price,
        quantity,
        side: form.side,
        symbol: form.symbol.toUpperCase(),
        userId: user.id,
      });

      toast.success(`${form.side} trade saved.`);
      setForm(defaultTradeForm);
      await loadPortfolio();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save trade";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  const totalValue = holdings.reduce((sum, holding) => sum + holding.currentPrice * holding.shares, 0);
  const totalCost = holdings.reduce((sum, holding) => sum + holding.avgCost * holding.shares, 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : "0.00";
  const predictedTotal = holdings.reduce((sum, holding) => sum + holding.predicted * holding.shares, 0);
  const predictedGrowth = totalValue > 0 ? ((predictedTotal - totalValue) / totalValue * 100).toFixed(1) : "0.0";

  if (error) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Track your holdings and AI-predicted growth</p>
        </div>
        <div className="glass-card p-12 flex flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-bearish mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <button onClick={() => loadPortfolio()} className="text-primary hover:underline">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Trades are stored per user in Supabase and valued with live proxy data.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Value</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-bullish" />
                <span className="text-sm text-muted-foreground">Total Gain/Loss</span>
              </div>
              <div className={`text-2xl font-bold ${totalGain >= 0 ? "text-bullish" : "text-bearish"}`}>
                {totalGain >= 0 ? "+" : "-"}{formatCurrency(Math.abs(totalGain))} ({gainPct}%)
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Predicted Growth</span>
              </div>
              <div className={`text-2xl font-bold ${Number(predictedGrowth) >= 0 ? "text-primary" : "text-bearish"}`}>
                {Number(predictedGrowth) >= 0 ? "+" : ""}{predictedGrowth}%
              </div>
              <div className="text-xs text-muted-foreground">Based on current AI prediction endpoint</div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Holdings</h3>
            {isLoading ? (
              <div className="text-muted-foreground">Loading portfolio data...</div>
            ) : holdings.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No open positions yet. Add your first trade to start tracking this portfolio.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Ticker", "Shares", "Avg Cost", "Current", "Predicted", "P&L", "Allocation"].map((header) => (
                        <th key={header} className="text-left text-xs font-medium text-muted-foreground pb-3">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => {
                      const pnl = (holding.currentPrice - holding.avgCost) * holding.shares;
                      const pnlPct = holding.avgCost > 0
                        ? ((holding.currentPrice - holding.avgCost) / holding.avgCost * 100).toFixed(1)
                        : "0.0";
                      const isUp = pnl >= 0;
                      const allocation = totalValue > 0
                        ? ((holding.currentPrice * holding.shares) / totalValue * 100).toFixed(0)
                        : "0";

                      return (
                        <tr key={holding.ticker} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 text-sm font-semibold text-foreground">{holding.ticker}</td>
                          <td className="py-3 text-sm text-foreground">{holding.shares}</td>
                          <td className="py-3 text-sm text-muted-foreground">{formatCurrency(holding.avgCost)}</td>
                          <td className="py-3 text-sm text-foreground">{formatCurrency(holding.currentPrice)}</td>
                          <td className="py-3 text-sm text-primary">
                            {formatCurrency(holding.predicted)}
                            <div className="text-[11px] text-muted-foreground">{holding.confidence.toFixed(1)}% confidence</div>
                          </td>
                          <td className="py-3">
                            <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-bullish" : "text-bearish"}`}>
                              {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {formatCurrency(Math.abs(pnl))} ({pnlPct}%)
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-muted rounded-full">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${allocation}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{allocation}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add Trade</h3>
            <form onSubmit={handleTradeSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Symbol</label>
                <div className="flex gap-2">
                  <Input
                    value={form.symbol}
                    onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
                    placeholder="AAPL"
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchCurrentPrice(form.symbol)}
                    disabled={form.isFetchingPrice || !form.symbol}
                    className="shrink-0"
                  >
                    {form.isFetchingPrice ? "..." : "Fetch"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Side</label>
                  <select
                    value={form.side}
                    onChange={(event) => setForm((current) => ({ ...current, side: event.target.value as "BUY" | "SELL" }))}
                    className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                    placeholder="10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Price</label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="172.50"
                  required
                />
              </div>
              <Button type="submit" disabled={isSaving || isLoading} className="w-full">
                {isSaving ? "Saving Trade..." : "Save Trade"}
              </Button>
            </form>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Trades</h3>
            <div className="space-y-3">
              {trades.length === 0 ? (
                <div className="text-sm text-muted-foreground">No trades recorded yet.</div>
              ) : (
                trades.slice(0, 8).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {trade.side} {trade.quantity} {trade.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(trade.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-foreground">{formatCurrency(trade.price)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(trade.total)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Portfolio;
