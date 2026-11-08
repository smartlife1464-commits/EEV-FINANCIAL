import React, { createContext, useContext, useState, useEffect } from 'react';
import { PERIOD_OPTIONS, PeriodOption } from '../components/analytics/PeriodSelector';

export interface PeriodContextType {
  period: string;
  startDate?: string;
  endDate?: string;
  periodLabel: string;
  setPeriod: (period: string, startDate?: string, endDate?: string) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [period, setPeriodState] = useState<string>(() => {
    return localStorage.getItem('eev_selected_period') || 'this_month';
  });

  const [startDate, setStartDate] = useState<string | undefined>(() => {
    return localStorage.getItem('eev_period_start') || undefined;
  });

  const [endDate, setEndDate] = useState<string | undefined>(() => {
    return localStorage.getItem('eev_period_end') || undefined;
  });

  const currentOption = PERIOD_OPTIONS.find((p) => p.id === period) || PERIOD_OPTIONS[4]; // 'this_month' default

  const periodLabel =
    period === 'custom' && startDate && endDate
      ? `${startDate} au ${endDate}`
      : currentOption.label;

  const setPeriod = (newPeriod: string, newStart?: string, newEnd?: string) => {
    setPeriodState(newPeriod);
    localStorage.setItem('eev_selected_period', newPeriod);

    if (newStart && newEnd) {
      setStartDate(newStart);
      setEndDate(newEnd);
      localStorage.setItem('eev_period_start', newStart);
      localStorage.setItem('eev_period_end', newEnd);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
      localStorage.removeItem('eev_period_start');
      localStorage.removeItem('eev_period_end');
    }
  };

  return (
    <PeriodContext.Provider
      value={{
        period,
        startDate,
        endDate,
        periodLabel,
        setPeriod,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
};

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
