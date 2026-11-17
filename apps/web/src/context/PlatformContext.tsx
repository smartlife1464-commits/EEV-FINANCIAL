import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, PlatformPublic } from '../services/api';
import { setCurrency } from '../utils/formatters';
import { applyBrandColor } from '../utils/brand';
import { useAuth } from './AuthContext';

/**
 * Configuration de l'installation (une installation = une église) : nom, logo, couleurs, monnaie,
 * modules activés, libellés des rôles, règle de ventilation. Chargée avant tout affichage.
 */

export const DEFAULT_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur général',
  lead_pastor: 'Pasteur principal',
  finance_lead: 'Responsable des finances',
  cashier: 'Caissier',
  protocol_lead: 'Responsable du protocole',
  protocol_agent: 'Agent du protocole',
  auditor: 'Auditeur',
};

const FALLBACK: PlatformPublic = {
  name: 'Gestion d’église',
  shortName: '',
  tagline: '',
  logo: '',
  colors: { primary: '#FFBC00', secondary: '#091338' },
  currency: { code: 'XAF', label: 'FCFA', words: 'francs CFA' },
  modules: {},
  roleLabels: DEFAULT_ROLE_LABELS,
  setupRequired: false,
};

export interface SplitLine {
  fundCode: string;
  percentage: number;
  label: string;
}

interface PlatformContextType {
  platform: PlatformPublic;
  ready: boolean;
  error: string | null;
  /** Module activé ? (vrai par défaut si inconnu) */
  isModuleEnabled: (key: string) => boolean;
  roleLabel: (role: string | undefined) => string;
  /** Règle de ventilation des recettes ordinaires (utilisateur connecté) */
  split: SplitLine[];
  remainderFund: string;
  refresh: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState<PlatformPublic>(FALLBACK);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((p: PlatformPublic) => {
    const merged = { ...FALLBACK, ...p, roleLabels: { ...DEFAULT_ROLE_LABELS, ...(p.roleLabels || {}) } };
    setPlatform(merged);
    setCurrency(merged.currency);
    applyBrandColor(merged.colors?.primary);
    document.title = merged.shortName || merged.name;
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (favicon && merged.logo) favicon.href = merged.logo;
  }, []);

  const load = useCallback(async () => {
    try {
      const p = await api.getPlatformPublic();
      apply(p);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Serveur injoignable');
    } finally {
      setReady(true);
    }
  }, [apply]);

  useEffect(() => {
    load();
  }, [load]);

  const { data: full } = useQuery({
    queryKey: ['platform-config'],
    queryFn: () => api.getPlatformConfig(),
    enabled: isAuthenticated && ready && !platform.setupRequired,
    staleTime: 60_000,
  });

  const refresh = useCallback(async () => {
    await load();
    await queryClient.invalidateQueries({ queryKey: ['platform-config'] });
    await queryClient.invalidateQueries({ queryKey: ['ministry-settings'] });
  }, [load, queryClient]);

  const value = useMemo<PlatformContextType>(
    () => ({
      platform,
      ready,
      error,
      isModuleEnabled: (key: string) => platform.modules?.[key] !== false,
      roleLabel: (role) => (role ? platform.roleLabels?.[role] || DEFAULT_ROLE_LABELS[role] || role : ''),
      split: (full?.config?.finance?.split as SplitLine[]) || [
        { fundCode: 'GENERAL', percentage: 80, label: 'Fonds général' },
        { fundCode: 'TITHE_OF_TITHES', percentage: 10, label: 'Dîme des dîmes' },
        { fundCode: 'WELFARE_AID', percentage: 10, label: 'Aide sociale' },
      ],
      remainderFund: full?.config?.finance?.remainderFund || 'GENERAL',
      refresh,
    }),
    [platform, ready, error, full, refresh]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
};

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within a PlatformProvider');
  return ctx;
}
