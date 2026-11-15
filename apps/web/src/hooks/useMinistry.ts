import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface MinistrySettings {
  name: string;
  headquarters: string;
  postalBox: string;
  phone: string;
  email: string;
  website: string;
  mainPastor: string;
  venueCapacity: number;
}

export const DEFAULT_MINISTRY: MinistrySettings = {
  name: 'Ministère Esprit & Vie',
  headquarters: '',
  postalBox: '',
  phone: '',
  email: '',
  website: '',
  mainPastor: '',
  venueCapacity: 0,
};

/**
 * Identité officielle du ministère (Paramètres) utilisée sur tous les documents imprimables.
 * Remplace les coordonnées fictives codées en dur (« BP 1420 », « +237 699 00 00 00 »).
 */
export function useMinistry() {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery({
    queryKey: ['ministry-settings'],
    queryFn: () => api.getSettings(),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
  const ministry: MinistrySettings = { ...DEFAULT_MINISTRY, ...(data || {}) };

  const addressLine = [ministry.headquarters ? `Siège : ${ministry.headquarters}` : '', ministry.postalBox]
    .filter(Boolean)
    .join(' • ');
  const contactLine = [ministry.phone ? `Tél : ${ministry.phone}` : '', ministry.email, ministry.website]
    .filter(Boolean)
    .join(' • ');

  return {
    ministry,
    addressLine,
    contactLine,
    /** Ligne unique pour les en-têtes compacts */
    letterheadLine: [addressLine, contactLine].filter(Boolean).join(' • ') || 'Coordonnées à renseigner dans Paramètres',
  };
}
