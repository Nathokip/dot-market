import { useState, useEffect, useRef, useMemo } from "react";
import { createChart, type IChartApi } from "lightweight-charts";
import { useDailyCandles, useIntradayCandles } from "@/hooks/useMarketData";
import { generateCandlestickData } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi } from "lucide-react";

const timeFilters = ["1D", "1W", "1M", "3M", "1Y"] as const;

const TradingChart = () => {
  const [activeFilter, setActiveFilter] = useState<string>("3M");
  const [symbol] = useState("AAPL");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const { data: dailyData, isLoading: dailyLoading } = useDailyCandles(symbol);
  const { data: intradayData, isLoading: intradayLoading } = useIntradayCandles(symbol);

  const isLive =
    (dailyData && dailyData.length > 0) ||
    (intradayData && intradayData.length > 0);

  const chartData = useMemo(() => {
    let sourceData: any[];

    if (activeFilter === "1D" && intradayData && intradayData.length > 0) {
      sourceData = intradayData;
    } else if (dailyData && dailyData.length > 0) {
      const sliceDays =
        { "1D": 1, "1W": 5, "1M": 22, "3M": 66, "1Y": 100 }[activeFilter] || 66;
      sourceData = dailyData.slice(-sliceDays);
    } else {
      const mockDays =
        { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365 }[activeFilter] || 90;
      const mock = generateCandlestickData(365);
      sourceData = mock.slice(-mockDays);
    }

    const candles = sourceData.map((d: any) => {
      let time: string;
      if (d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
        // Already yyyy-mm-dd
        time = d.date;
      } else if (d.fullDate) {
        // Mock data with fullDate
        const dt = new Date(d.fullDate);
        time = dt.toISOString().slice(0, 10);
      } else if (d.date?.includes("T")) {
        // Intraday datetime - use unix timestamp
        time = String(Math.floor(new Date(d.date).getTime() / 1000));
      } else {
        // Fallback: try to parse, or generate sequential date
        const dt = new Date(d.date);
        time = isNaN(dt.getTime())
          ? new Date(Date.now()).toISOString().slice(0, 10)
          : dt.toISOString().slice(0, 10);
      }
      return {
        time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      };
    });

    // Sort and deduplicate by time (lightweight-charts requires unique ascending times)
    candles.sort((a: any, b: any) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    const uniqueCandles = candles.filter((item: any, index: number, self: any[]) =>
      index === 0 || item.time !== self[index - 1].time
    );

    const predictions = uniqueCandles.map((c: any) => ({
      time: c.time,
      value: +(c.close + (Math.random() - 0.3) * 3).toFixed(2),
    }));

    const volumes = uniqueCandles.map((c: any) => ({
      time: c.time,
      value: c.volume,
      color:
        c.close >= c.open
          ? "rgba(38, 198, 118, 0.15)"
          : "rgba(255, 75, 75, 0.15)",
    }));

    return { candles: uniqueCandles, predictions, volumes };
  }, [dailyData, intradayData, activeFilter]);

  const isLoading = dailyLoading && intradayLoading;

  useEffect(() => {
    if (!chartContainerRef.current || isLoading) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: "transparent" },
        textColor: "#7a8599",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: "#2d3748",
      },
      timeScale: {
        borderColor: "#2d3748",
        timeVisible: activeFilter === "1D",
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26c676",
      downColor: "#ff4b4b",
      borderUpColor: "#26c676",
      borderDownColor: "#ff4b4b",
      wickUpColor: "#26c676",
      wickDownColor: "#ff4b4b",
    });
    candleSeries.setData(chartData.candles as any);

    // AI Prediction line
    const predictionSeries = chart.addLineSeries({
      color: "#00bfff",
      lineWidth: 2,
      lineStyle: 2,
      crosshairMarkerVisible: false,
    });
    predictionSeries.setData(chartData.predictions as any);

    // Volume histogram
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volumeSeries.setData(chartData.volumes as any);
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    });
    ro.observe(chartContainerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartData, isLoading, activeFilter]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {symbol} — Apple Inc.
            </h3>
            {isLive && <Wifi className="h-4 w-4 text-bullish" />}
            {!isLive && !isLoading && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Mock
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isLive
              ? "Live market data via Alpha Vantage"
              : "Simulated data — API fallback"}
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {timeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="w-full h-[400px]" />
      ) : (
        <div ref={chartContainerRef} className="w-full h-[400px]" />
      )}

      <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-bullish/80" />
          <span>Bullish</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-bearish/80" />
          <span>Bearish</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-0.5"
            style={{
              borderBottom: "2px dashed hsl(195, 100%, 50%)",
            }}
          />
          <span>AI Prediction</span>
        </div>
      </div>
    </div>
  );
};

export default TradingChart;
