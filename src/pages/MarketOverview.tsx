import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { marketIndices, sectorPerformance, topStocks } from "@/lib/mockData";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

const MarketOverview = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Market Overview</h1>
        <p className="text-sm text-muted-foreground">Major indices, sector performance, and trending stocks</p>
      </div>

      {/* Indices */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {marketIndices.map((idx) => (
          <div key={idx.ticker} className="glass-card p-5">
            <div className="text-sm text-muted-foreground mb-1">{idx.name}</div>
            <div className="text-xl font-bold text-foreground">{idx.value.toLocaleString()}</div>
            <div className={`flex items-center gap-1 text-sm font-medium ${idx.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {idx.change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {idx.change >= 0 ? '+' : ''}{idx.change}%
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sector Performance */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Sector Performance</h3>
          <div className="space-y-3">
            {sectorPerformance.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full">
                    <div
                      className={`h-full rounded-full ${s.change >= 0 ? 'bg-bullish' : 'bg-bearish'}`}
                      style={{ width: `${Math.min(Math.abs(s.change) * 20, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-14 text-right ${s.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Stocks */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Trending Stocks</h3>
          <div className="space-y-3">
            {topStocks.slice(0, 6).map((s) => (
              <div key={s.ticker} className="flex items-center justify-between py-2 border-b border-border/30">
                <div>
                  <div className="text-sm font-semibold text-foreground">{s.ticker}</div>
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-foreground">${s.price.toFixed(2)}</div>
                  <div className={`text-xs font-medium flex items-center gap-1 justify-end ${
                    s.change >= 0 ? 'text-bullish' : 'text-bearish'
                  }`}>
                    {s.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketOverview;
