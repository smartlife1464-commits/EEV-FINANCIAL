import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  ShieldCheck,
  Plus,
  UserPlus,
  Mail,
  Phone,
  Lock,
  X,
  CheckCircle2,
  Users,
} from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case UserRole.LEAD_PASTOR:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-500 border border-amber-400/30">
            Leader Principal
          </span>
        );
      case UserRole.ADMIN:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Administrateur Général
          </span>
        );
      case UserRole.FINANCE_LEAD:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Responsable Finances
          </span>
        );
      case UserRole.CASHIER:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Caissier / Agent Financier
          </span>
        );
      case UserRole.PROTOCOL_LEAD:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Responsable Protocole
          </span>
        );
      case UserRole.PROTOCOL_AGENT:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-400 border border-slate-500/30">
            Agent Protocole
          </span>
        );
      case UserRole.AUDITOR:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
            Auditeur / Contrôleur
          </span>
        );
      default:
        return <Badge>{userRole}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <span>Gestion des Utilisateurs & Contrôle d'Accès (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Matrice stricte des permissions et habilitations des 7 rôles officiels du Ministère Esprit & Vie.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Créer un Utilisateur</span>
        </button>
      </div>

      {/* Table des Utilisateurs */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#101C3D] text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                <th className="py-4 px-6">Nom & Prénom</th>
                <th className="py-4 px-6">Email de Connexion</th>
                <th className="py-4 px-6">Téléphone</th>
                <th className="py-4 px-6">Rôle Officiel</th>
                <th className="py-4 px-6 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]/70">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-[#101C3D]/40 transition-colors">
                  <td className="py-4 px-6 font-black text-slate-900 dark:text-white">
                    {u.name || u.email}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {u.email}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                    {u.phone || '+237 6•• •• •• ••'}
                  </td>
                  <td className="py-4 px-6">{getRoleBadge(u.role)}</td>
                  <td className="py-4 px-6 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                      Actif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création Utilisateur */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-lg w-full p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-500 flex items-center justify-center shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Nouvel Utilisateur
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Création de compte avec attribution d'un profil sécurisé RBAC.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frère Marc Kamga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Adresse Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: marc@espritvie.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Mot de Passe Initial *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Rôle & Habilitations *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value={UserRole.LEAD_PASTOR}>Leader Principal (Validation Souveraine)</option>
                  <option value={UserRole.ADMIN}>Administrateur Général (Configuration)</option>
                  <option value={UserRole.FINANCE_LEAD}>Responsable Finances (Gestion Caisse)</option>
                  <option value={UserRole.CASHIER}>Caissier / Agent Financier (Encaissement)</option>
                  <option value={UserRole.PROTOCOL_LEAD}>Responsable Protocole (Validation Culte)</option>
                  <option value={UserRole.PROTOCOL_AGENT}>Agent Protocole (Comptage Fréquentation)</option>
                  <option value={UserRole.AUDITOR}>Auditeur / Contrôleur (Lecture Seule & Audit)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Numéro de Téléphone
                </label>
                <input
                  type="tel"
                  placeholder="+237 6•• •• •• ••"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#16214A]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Création...' : 'Créer le Compte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
