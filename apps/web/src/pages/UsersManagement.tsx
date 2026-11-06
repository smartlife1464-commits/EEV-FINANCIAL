import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { ShieldCheck, Plus, UserPlus, Mail, Phone, Lock } from 'lucide-react';
import { UserRole } from '@eev/shared-types';

export const UsersManagement: React.FC = () => {
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.getUsers(),
  });

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PROTOCOL_AGENT);
  const [phone, setPhone] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({ name, email, password, role, phone });
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création');
    }
  };

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case UserRole.LEAD_PASTOR:
        return <Badge variant="gold">Leader Principal</Badge>;
      case UserRole.ADMIN:
        return <Badge variant="info">Administrateur</Badge>;
      case UserRole.FINANCE_LEAD:
        return <Badge variant="success">Resp. Finances</Badge>;
      case UserRole.CASHIER:
        return <Badge variant="warning">Caissier</Badge>;
      case UserRole.PROTOCOL_LEAD:
        return <Badge variant="neutral">Resp. Protocole</Badge>;
      case UserRole.PROTOCOL_AGENT:
        return <Badge variant="neutral">Agent Protocole</Badge>;
      case UserRole.AUDITOR:
        return <Badge variant="danger">Auditeur / Contrôleur</Badge>;
      default:
        return <Badge>{userRole}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <span>Gestion des Utilisateurs & Attribution des Rôles (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Contrôle d'accès strict selon les 7 profils autorisés du Ministère Esprit & Vie.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Créer un Compte</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6">Nom & Prénom</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Téléphone</th>
                <th className="py-4 px-6">Rôle & Niveau</th>
                <th className="py-4 px-6 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                    {u.name || u.email}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500">{u.email}</td>
                  <td className="py-4 px-6 text-xs text-slate-500">{u.phone || '+237 6•• •• •• ••'}</td>
                  <td className="py-4 px-6">{getRoleBadge(u.role)}</td>
                  <td className="py-4 px-6 text-right">
                    <Badge variant="success">Actif</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Créer un Nouvel Utilisateur
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Nom Complet *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Mot de Passe *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Rôle RBAC *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value={UserRole.PROTOCOL_AGENT}>Agent Protocole</option>
                  <option value={UserRole.PROTOCOL_LEAD}>Responsable Protocole</option>
                  <option value={UserRole.CASHIER}>Caissier / Agent Financier</option>
                  <option value={UserRole.FINANCE_LEAD}>Responsable Finances</option>
                  <option value={UserRole.LEAD_PASTOR}>Leader Principal</option>
                  <option value={UserRole.AUDITOR}>Auditeur / Contrôleur</option>
                  <option value={UserRole.ADMIN}>Administrateur Général</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

