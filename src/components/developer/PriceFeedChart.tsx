import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PricePoint {
  time: string;
  price: number;
}

const generatePriceData = (basePrice: number, volatility: number, points = 24): PricePoint[] => {
  const data: PricePoint[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const change = (Math.random() - 0.48) * volatility;
    price = Math.max(price * 0.9, Math.min(price * 1.1, price + change));
    data.push({
      time: new Date(now - i * 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: Math.round(price * 100) / 100,
    });
  }
  return data;
};

const FEED_CONFIGS: Record<string, { base: number; vol: number }> = {
  "MUSD / USD": { base: 1.0, vol: 0.005 },
  "BTC / USD": { base: 67500, vol: 350 },
  "cbBTC / USD": { base: 67450, vol: 340 },
};

export const PriceFeedChart = ({ feedName }: { feedName: string }) => {
  const config = FEED_CONFIGS[feedName] || { base: 100, vol: 1 };
  const data = useMemo(() => generatePriceData(config.base, config.vol), [feedName]);
  
  const currentPrice = data[data.length - 1].price;
  const prevPrice = data[0].price;
  const change = ((currentPrice - prevPrice) / prevPrice) * 100;
  const isUp = change >= 0;

  const min = Math.min(...data.map((d) => d.price));
  const max = Math.max(...data.map((d) => d.price));
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 400;
      const y = 100 - ((d.price - min) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,100 ${points} 400,100`;

  return (
    <div className="bg-secondary/40 rounded-xl border border-border p-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-display font-bold text-foreground">{feedName}</h4>
          <p className="text-2xl font-mono font-bold text-foreground">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
          isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        }`}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isUp ? "+" : ""}{change.toFixed(2)}%
        </div>
      </div>

      <svg viewBox="0 0 400 100" className="w-full h-32" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${feedName.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={areaPoints}
          fill={`url(#grad-${feedName.replace(/\s/g, "")})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={isUp ? "#22c55e" : "#ef4444"}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
        <span>{data[0].time}</span>
        <span>{data[Math.floor(data.length / 2)].time}</span>
        <span>{data[data.length - 1].time}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div className="bg-card rounded-lg p-2 border border-border">
          <p className="text-[10px] text-muted-foreground">24h High</p>
          <p className="text-sm font-mono font-semibold text-foreground">${max.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-lg p-2 border border-border">
          <p className="text-[10px] text-muted-foreground">24h Low</p>
          <p className="text-sm font-mono font-semibold text-foreground">${min.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-lg p-2 border border-border">
          <p className="text-[10px] text-muted-foreground">24h Volume</p>
          <p className="text-sm font-mono font-semibold text-foreground">${(Math.random() * 50 + 10).toFixed(1)}M</p>
        </div>
      </div>
    </div>
  );
};
