import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { portfolioHoldings } from "@/lib/mockData";
import { ArrowUp, ArrowDown, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

const totalValue = portfolioHoldings.reduce((s, h) => s + h.currentPrice * h.shares, 0);
const totalCost = portfolioHoldings.reduce((s, h) => s + h.avgCost * h.shares, 0);
const totalGain = totalValue - totalCost;
const gainPct = ((totalGain / totalCost) * 100).toFixed(2);

const Portfolio = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Track your holdings and AI-predicted growth</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Value</span>
          </div>
          <div className="text-2xl font-bold text-foreground">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-bullish" />
            <span className="text-sm text-muted-foreground">Total Gain/Loss</span>
          </div>
          <div className="text-2xl font-bold text-bullish">
            +${totalGain.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({gainPct}%)
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Predicted Growth</span>
          </div>
          <div className="text-2xl font-bold text-primary">+3.8%</div>
          <div className="text-xs text-muted-foreground">Next 30 days</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Holdings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Ticker', 'Shares', 'Avg Cost', 'Current', 'Predicted', 'P&L', 'Allocation'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground pb-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolioHoldings.map((h) => {
                const pnl = (h.currentPrice - h.avgCost) * h.shares;
                const pnlPct = ((h.currentPrice - h.avgCost) / h.avgCost * 100).toFixed(1);
                const isUp = pnl >= 0;
                return (
                  <tr key={h.ticker} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 text-sm font-semibold text-foreground">{h.ticker}</td>
                    <td className="py-3 text-sm text-foreground">{h.shares}</td>
                    <td className="py-3 text-sm text-muted-foreground">${h.avgCost.toFixed(2)}</td>
                    <td className="py-3 text-sm text-foreground">${h.currentPrice.toFixed(2)}</td>
                    <td className="py-3 text-sm text-primary">${h.predicted.toFixed(2)}</td>
                    <td className="py-3">
                      <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-bullish' : 'text-bearish'}`}>
                        {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        ${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({pnlPct}%)
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${h.allocation}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{h.allocation}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Portfolio;
