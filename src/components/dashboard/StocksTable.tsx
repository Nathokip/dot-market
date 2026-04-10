import { topStocks } from "@/lib/mockData";
import { ArrowUp, ArrowDown } from "lucide-react";

const StocksTable = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Top Predicted Stocks</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-3">Ticker</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3">Price</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3">Predicted</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3">Confidence</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-3">Trend</th>
            </tr>
          </thead>
          <tbody>
            {topStocks.map((stock) => (
              <tr key={stock.ticker} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3">
                  <div className="font-semibold text-sm text-foreground">{stock.ticker}</div>
                  <div className="text-xs text-muted-foreground">{stock.name}</div>
                </td>
                <td className="text-right text-sm text-foreground">${stock.price.toFixed(2)}</td>
                <td className="text-right text-sm text-foreground">${stock.predicted.toFixed(2)}</td>
                <td className="text-right">
                  <span className={`text-sm font-medium ${stock.confidence >= 85 ? 'text-bullish' : 'text-muted-foreground'}`}>
                    {stock.confidence}%
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {stock.trend === 'bullish' ? (
                      <ArrowUp className="h-4 w-4 text-bullish" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-bearish" />
                    )}
                    <span className={`text-sm font-medium ${
                      stock.trend === 'bullish' ? 'text-bullish' : 'text-bearish'
                    }`}>
                      {stock.change > 0 ? '+' : ''}{stock.change}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StocksTable;
