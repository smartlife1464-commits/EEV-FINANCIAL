import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricVariationData {
  current: number;
  previous: number;
  difference: number;
  percentage: number;
  direction: 'up' | 'down' | 'neutral';
  isFavorable: boolean;
}

interface MetricCardProps {
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  title: string;
  value: string | number;
  subtext?: string;
  variation?: MetricVariationData;
  unit?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  iconColor = 'text-amber-500',
  iconBg = 'bg-amber-400/15 border-amber-400/30',
  title,
  value,
  subtext,
  variation,
  unit,
}) => {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-2xl ${iconBg} border flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        {variation && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
              variation.direction === 'neutral'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                : variation.isFavorable
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
            }`}
          >
            {variation.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {variation.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {variation.direction === 'neutral' && <Minus className="w-3 h-3" />}
            <span>
              {variation.percentage >= 0 ? '+' : ''}
              {variation.percentage}%
            </span>
          </span>
        )}
      </div>

      <div>
        <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
          <span>{value}</span>
          {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
          {title}
        </p>

        {subtext ? (
          <p className="text-[11px] text-slate-400 mt-1">{subtext}</p>
        ) : variation ? (
          <p className="text-[11px] text-slate-400 mt-1">
            {variation.difference >= 0 ? '+' : ''}
            {typeof variation.difference === 'number' && variation.difference.toLocaleString('fr-FR')}{' '}
            vs période précédente
          </p>
        ) : null}
      </div>
    </div>
  );
};
