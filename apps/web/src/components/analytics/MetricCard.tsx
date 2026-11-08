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
    <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col justify-between space-y-4 card-hover-effect">
      <div className="flex items-center justify-between">
        <div className={`w-14 h-14 rounded-2xl ${iconBg} border flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>

        {variation && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
              variation.direction === 'neutral'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                : variation.isFavorable
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            {variation.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {variation.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {variation.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>
              {variation.percentage >= 0 ? '+' : ''}
              {variation.percentage}%
            </span>
          </span>
        )}
      </div>

      <div>
        <div className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5 tracking-tight">
          <span>{value}</span>
          {unit && <span className="text-sm font-bold text-slate-400">{unit}</span>}
        </div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-1">
          {title}
        </p>

        {subtext ? (
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtext}</p>
        ) : variation ? (
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {variation.difference >= 0 ? '+' : ''}
            {typeof variation.difference === 'number' && variation.difference.toLocaleString('fr-FR')}{' '}
            vs période précédente
          </p>
        ) : null}
      </div>
    </div>
  );
};
