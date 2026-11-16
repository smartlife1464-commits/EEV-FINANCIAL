import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const storageKey = (userId?: string) => `eev_notifications_read_${userId || 'anon'}`;

function readSet(userId?: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(userId)) || '[]'));
  } catch {
    return new Set();
  }
}

/**
 * Notifications opérationnelles (calculées côté serveur) + état « lu » mémorisé par utilisateur.
 * Rafraîchies automatiquement toutes les 60 secondes.
 */
export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const [readIds, setReadIds] = useState<Set<string>>(() => readSet(user?.id));

  useEffect(() => {
    setReadIds(readSet(user?.id));
  }, [user?.id]);

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.getNotifications(),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const persist = useCallback(
    (next: Set<string>) => {
      setReadIds(new Set(next));
      try {
        localStorage.setItem(storageKey(user?.id), JSON.stringify(Array.from(next).slice(-500)));
      } catch {
        /* stockage indisponible */
      }
    },
    [user?.id]
  );

  const notifications = (query.data || []).map((n: any) => ({ ...n, unread: !readIds.has(n.id) }));
  const unreadCount = notifications.filter((n: any) => n.unread).length;

  return {
    ...query,
    notifications,
    unreadCount,
    markAsRead: (id: string) => persist(new Set([...readIds, id])),
    markAllAsRead: () => persist(new Set([...readIds, ...notifications.map((n: any) => n.id)])),
  };
}
