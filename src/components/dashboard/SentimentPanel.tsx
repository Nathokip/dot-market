import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { sentimentData, newsItems } from "@/lib/mockData";

const SentimentPanel = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Sentiment Analysis</h3>

      <div className="flex items-center gap-6 mb-6">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
              >
                {sentimentData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {sentimentData.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-sm text-muted-foreground">{s.name}</span>
              <span className="text-sm font-semibold text-foreground ml-auto">{s.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* News feed */}
      <h4 className="text-sm font-semibold text-foreground mb-3">Latest News</h4>
      <div className="space-y-3">
        {newsItems.slice(0, 4).map((news, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
              news.sentiment === 'bullish' ? 'bg-bullish' : 'bg-bearish'
            }`} />
            <div className="min-w-0">
              <p className="text-sm text-foreground leading-tight truncate">{news.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{news.source} · {news.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentPanel;
