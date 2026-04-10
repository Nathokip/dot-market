import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { topStocks } from "@/lib/mockData";
import { ArrowUp, ArrowDown, Brain, Target, TrendingUp } from "lucide-react";

const Predictions = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Predictions</h1>
        <p className="text-sm text-muted-foreground">Machine learning forecasts across your watchlist</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <Brain className="h-5 w-5 text-primary mb-2" />
          <div className="text-sm text-muted-foreground">Active Models</div>
          <div className="text-2xl font-bold text-foreground">3</div>
          <div className="text-xs text-muted-foreground">LSTM, RF, Prophet</div>
        </div>
        <div className="glass-card p-5">
          <Target className="h-5 w-5 text-bullish mb-2" />
          <div className="text-sm text-muted-foreground">Avg Confidence</div>
          <div className="text-2xl font-bold text-foreground">87%</div>
        </div>
        <div className="glass-card p-5">
          <TrendingUp className="h-5 w-5 text-primary mb-2" />
          <div className="text-sm text-muted-foreground">Predictions Today</div>
          <div className="text-2xl font-bold text-foreground">24</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">All Predictions</h3>
        <div className="grid gap-4">
          {topStocks.map((stock) => {
            const priceDiff = stock.predicted - stock.price;
            const pctDiff = ((priceDiff / stock.price) * 100).toFixed(2);
            return (
              <div key={stock.ticker} className="bg-muted/20 rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    stock.trend === 'bullish' ? 'bg-bullish/10' : 'bg-bearish/10'
                  }`}>
                    {stock.trend === 'bullish' ? (
                      <ArrowUp className="h-6 w-6 text-bullish" />
                    ) : (
                      <ArrowDown className="h-6 w-6 text-bearish" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{stock.ticker}</div>
                    <div className="text-sm text-muted-foreground">{stock.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Current</div>
                    <div className="text-sm font-semibold text-foreground">${stock.price.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Predicted</div>
                    <div className="text-sm font-semibold text-primary">${stock.predicted.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Change</div>
                    <div className={`text-sm font-semibold ${priceDiff >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                      {priceDiff >= 0 ? '+' : ''}{pctDiff}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className="text-sm font-semibold text-foreground">{stock.confidence}%</div>
                  </div>
                  <div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      stock.trend === 'bullish'
                        ? 'bg-bullish/20 text-bullish'
                        : 'bg-bearish/20 text-bearish'
                    }`}>
                      {stock.trend === 'bullish' ? 'BUY' : 'SELL'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Predictions;
