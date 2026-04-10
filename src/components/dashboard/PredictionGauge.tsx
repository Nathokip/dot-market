const PredictionGauge = () => {
  const confidence = 94;
  const accuracy = 91;
  const circumference = 2 * Math.PI * 45;
  const confOffset = circumference - (confidence / 100) * circumference;
  const accOffset = circumference - (accuracy / 100) * circumference;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">AI Prediction</h3>

      <div className="flex justify-center gap-6 mb-6">
        {/* Confidence gauge */}
        <div className="relative">
          <svg width="110" height="110" className="-rotate-90">
            <circle cx="55" cy="55" r="45" stroke="hsl(225, 25%, 15%)" strokeWidth="8" fill="none" />
            <circle
              cx="55" cy="55" r="45"
              stroke="hsl(145, 70%, 50%)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={confOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{confidence}%</span>
            <span className="text-[10px] text-muted-foreground">Confidence</span>
          </div>
        </div>

        {/* Accuracy gauge */}
        <div className="relative">
          <svg width="110" height="110" className="-rotate-90">
            <circle cx="55" cy="55" r="45" stroke="hsl(225, 25%, 15%)" strokeWidth="8" fill="none" />
            <circle
              cx="55" cy="55" r="45"
              stroke="hsl(195, 100%, 50%)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={accOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground">{accuracy}%</span>
            <span className="text-[10px] text-muted-foreground">Accuracy</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Trend Direction</span>
          <span className="text-sm font-semibold text-bullish">▲ Bullish</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Signal</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-bullish/20 text-bullish">BUY</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Model</span>
          <span className="text-sm text-foreground">LSTM + Random Forest</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Target Price</span>
          <span className="text-sm font-semibold text-foreground">$186.80</span>
        </div>
      </div>
    </div>
  );
};

export default PredictionGauge;
