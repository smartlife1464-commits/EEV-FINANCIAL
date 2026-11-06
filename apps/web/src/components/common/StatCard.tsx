import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    text?: string;
  };
  accentColor?: 'gold' | 'navy' | 'emerald' | 'indigo' | 'rose' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'navy',
}) => {
  const colorMap = {
    gold: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
    navy: 'bg-slate-900/10 text-slate-800 border-slate-200/50 dark:text-slate-200',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
    indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50',
    rose: 'bg-rose-500/10 text-rose-600 border-rose-200/50',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl border ${colorMap[accentColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
        {value}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{subtitle}</span>
        {trend && (
          <span
            className={`font-semibold flex items-center gap-0.5 ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.text || ''}
          </span>
        )}
      </div>
    </div>
  );
};
