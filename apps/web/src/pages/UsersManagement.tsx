import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  Lock,
  X,
  CheckCircle2,
  Users,
  Search,
  Filter,
  ShieldAlert,
  Power,
  KeyRound,
  Check,
} from 'lucide-react';
import { UserRole } from '@eev/shared-types';
import { useAuth } from '../context/AuthContext';

export const UsersManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.getUsers(),
  });

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PROTOCOL_AGENT);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
      setActionSuccess('Compte utilisateur créé avec succès et activé.');
      setTimeout(() => setActionSuccess(null), 4000);
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de l’utilisateur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userRecord: any) => {
    const newStatus = !userRecord.is_active;
    const confirmMsg = newStatus
      ? `Réactiver le compte de ${userRecord.name || userRecord.email} ?`
      : `Désactiver temporairement le compte de ${userRecord.name || userRecord.email} ?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateUserStatus(userRecord.id, newStatus);
      setActionSuccess(`Statut mis à jour pour ${userRecord.name || userRecord.email}.`);
      setTimeout(() => setActionSuccess(null), 3500);
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Impossible de mettre à jour le statut.');
    }
  };

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case UserRole.LEAD_PASTOR:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-500 border border-amber-400/35">
            👑 Leader Principal (Superviseur)
          </span>
        );
      case UserRole.ADMIN:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/35">
            ⚙️ Administrateur Général
          </span>
        );
      case UserRole.FINANCE_LEAD:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/35">
            💰 Responsable Finances
          </span>
        );
      case UserRole.CASHIER:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/35">
            💵 Caissier Principal
          </span>
        );
      case UserRole.PROTOCOL_LEAD:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/35">
            📋 Responsable Protocole
          </span>
        );
      case UserRole.PROTOCOL_AGENT:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-500/20 text-slate-400 border border-slate-500/35">
            🙋‍♂️ Agent Protocole
          </span>
        );
      case UserRole.AUDITOR:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/35">
            🔍 Auditeur / Contrôleur
          </span>
        );
      default:
        return <Badge>{userRole}</Badge>;
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Banner & Security Statement */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-7 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
            <span>Gestion des Utilisateurs & Habilitations (RBAC)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-3xl">
            L'inscription publique est fermée. Seuls l'<strong>Administrateur Général</strong> et le <strong>Superviseur Général (Pasteur Principal)</strong> sont habilités à créer, configurer et administrer les comptes d'accès de la plateforme.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-5 h-5 stroke-[2.5]" />
          <span>Créer un Utilisateur</span>
        </button>
      </div>

      {/* Security Notice Pill */}
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-400/30 flex items-start gap-3.5 text-xs text-slate-700 dark:text-slate-300">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-black text-slate-900 dark:text-amber-400 mb-0.5">
            Principe de moindre privilège & Ségrégation des fonctions
          </p>
          <p>
            Chaque collaborateur du Ministère Esprit & Vie dispose d'un périmètre strictement délimité. Les membres du Protocole n'ont aucun accès aux écritures financières, et le caissier ne peut pas valider ses propres décaissements.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filtres & Recherche */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#060D24] border border-slate-200 dark:border-[#16214A] rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-[#060D24] border border-slate-200 dark:border-[#16214A] rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            <option value="all">Tous les rôles ({users.length})</option>
            <option value={UserRole.LEAD_PASTOR}>Leader Principal</option>
            <option value={UserRole.ADMIN}>Administrateur Général</option>
            <option value={UserRole.FINANCE_LEAD}>Responsable Finances</option>
            <option value={UserRole.CASHIER}>Caissier</option>
            <option value={UserRole.PROTOCOL_LEAD}>Responsable Protocole</option>
            <option value={UserRole.PROTOCOL_AGENT}>Agent Protocole</option>
            <option value={UserRole.AUDITOR}>Auditeur</option>
          </select>
        </div>
      </div>

      {/* Table des Utilisateurs */}
      <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#101C3D] text-slate-400 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                <th className="py-4 px-6">Collaborateur</th>
                <th className="py-4 px-6">Identifiant Email</th>
                <th className="py-4 px-6">Contact Téléphonique</th>
                <th className="py-4 px-6">Habilitation Officielle</th>
                <th className="py-4 px-6 text-center">Statut</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]/70">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    Aucun utilisateur ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: any) => {
                  const isActive = u.is_active !== false;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#101C3D]/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-black text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-500 font-black text-sm flex items-center justify-center shrink-0">
                            {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900 dark:text-white">
                              {u.name || u.email}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              ID: {u.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-300 font-mono">
                        {u.email}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-300">
                        {u.phone || '+237 6•• •• •• ••'}
                      </td>
                      <td className="py-4 px-6">{getRoleBadge(u.role)}</td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{isActive ? 'Actif' : 'Suspendu'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                            isActive
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                          }`}
                          title={isActive ? 'Suspendre l’accès' : 'Réactiver l’accès'}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Suspendre' : 'Activer'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création Utilisateur par l'Admin ou le Superviseur */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] rounded-3xl max-w-lg w-full p-7 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-500 flex items-center justify-center shrink-0 shadow-md">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Création de Compte Collaborateur
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Délivrance d'identifiants accrédités par la Direction Générale
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nom & Prénom du collaborateur *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frère Marc Kamga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Adresse Email Institutionnelle *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: marc@espritvie.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Mot de Passe Initial *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Rôle & Habilitation RBAC *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value={UserRole.LEAD_PASTOR}>👑 Leader Principal (Superviseur Général)</option>
                  <option value={UserRole.ADMIN}>⚙️ Administrateur Général (Configuration)</option>
                  <option value={UserRole.FINANCE_LEAD}>💰 Responsable Finances (Gestion Trésorerie)</option>
                  <option value={UserRole.CASHIER}>💵 Caissier Principal (Encaissement Caisse)</option>
                  <option value={UserRole.PROTOCOL_LEAD}>📋 Responsable Protocole (Gestion Fréquentation)</option>
                  <option value={UserRole.PROTOCOL_AGENT}>🙋‍♂️ Agent Protocole (Saisie des Fiches)</option>
                  <option value={UserRole.AUDITOR}>🔍 Auditeur / Contrôleur (Lecture Seule & Traçabilité)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Numéro de Téléphone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+237 6•• •• •• ••"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070D22] border border-slate-200 dark:border-[#16214A] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#16214A]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Création en cours...' : 'Créer et Activer le Compte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
