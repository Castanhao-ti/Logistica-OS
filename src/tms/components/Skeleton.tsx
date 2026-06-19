import React from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

export function Skeleton({ width, height = 12, radius = 4, style, className }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className ?? ''}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

interface SkeletonRowProps {
  cells?: number;
  widths?: Array<number | string>;
}

const DEFAULT_WIDTHS: Array<number | string> = ['70%', '90%', '55%', '65%', '40%'];

export function SkeletonRow({ cells = 5, widths }: SkeletonRowProps) {
  const list = widths ?? DEFAULT_WIDTHS.slice(0, cells);
  return (
    <tr className="skeleton-row">
      {Array.from({ length: cells }).map((_, i) => (
        <td key={i}>
          <Skeleton width={list[i % list.length] ?? '70%'} height={12} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonKpiCard() {
  return (
    <div className="skeleton-kpi">
      <div className="skeleton-kpi__head">
        <Skeleton width={90} height={10} />
        <Skeleton width={34} height={34} radius={8} />
      </div>
      <Skeleton width="60%" height={26} radius={6} />
      <div className="skeleton-kpi__foot">
        <Skeleton width="40%" height={10} />
        <Skeleton width={56} height={18} radius={20} />
      </div>
    </div>
  );
}
