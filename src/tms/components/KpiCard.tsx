import React from 'react';

export interface KpiCardProps {
  label: string;
  value: string;
  reference?: string;
  trend?: number;
  trendType?: 'pos' | 'neg';
  icon: React.ReactNode;
  iconColor?: string;
  spark?: number[];
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${30 - ((p - min) / range) * 26}`)
    .join(' ');
  return (
    <svg className="kpi-card__sparkline" viewBox="0 0 100 32" preserveAspectRatio="none">
      <polyline
        points={coords}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function KpiCard({
  label,
  value,
  reference,
  trend,
  trendType,
  icon,
  iconColor = '#2D4A3E',
  spark,
}: KpiCardProps) {
  const tone: 'pos' | 'neg' = trendType ?? (trend != null && trend < 0 ? 'neg' : 'pos');
  const showTrend = trend != null;
  const trendLabel =
    trend != null
      ? `${tone === 'pos' ? '↑' : '↓'} ${Math.abs(trend).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
      : '';

  const iconStyle: React.CSSProperties = {
    backgroundColor: hexToRgba(iconColor, 0.12),
    color: iconColor,
  };

  return (
    <div className="kpi-card">
      <div className="kpi-card__head">
        <span className="kpi-card__label">{label}</span>
        <div className="kpi-card__icon" style={iconStyle}>{icon}</div>
      </div>

      <span className="kpi-card__value">{value}</span>

      {spark && spark.length > 1 && (
        <Sparkline points={spark} color={iconColor} />
      )}

      {(reference || showTrend) && (
        <div className="kpi-card__foot">
          <span className="kpi-card__reference">{reference ?? ''}</span>
          {showTrend && (
            <span className={`kpi-card__trend kpi-card__trend--${tone}`}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default KpiCard;
