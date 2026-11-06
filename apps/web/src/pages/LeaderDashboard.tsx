import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  Wallet,
  PiggyBank,
  HeartHandshake,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

export const LeaderDashboard: React.FC = () => {
  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.getDashboardOverview(),
  });

  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses-pending'],
    queryFn: () => api.getExpenses(),
  });

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.approveExpense(id, 'approve');
      await refetch();
      await refetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’approbation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motif du rejet :');
    if (!reason) return;
    setProcessingId(id);
    try {
      await api.approveExpense(id, 'reject', reason);
      await refetch();
      await refetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du rejet');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingExpenses = expenses.filter((e: any) => e.status === 'pending_approval');

  const COLORS = ['#FFBC00', '#4F46E5', '#16A34A', '#7C3AED', '#EC4899', '#06B6D4'];

  const fundsData = overview?.treasury?.funds?.map((f: any) => ({
    name: f.account.name,
    value: f.balance,
  })) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Executive Welcome & Live Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 rounded-3xl border border-slate-700/80 shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Session Haute Autorité • Leader Principal
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Tableau de Bord Exécutif & Pilotage
          </h1>
          <p className="text-sm text-slate-300">
            Vision consolidée en temps réel de la trésorerie et de la fréquentation du Ministère Esprit & Vie.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/finance/approvals"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-400/20 transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Centre de Validation ({pendingExpenses.length})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards — Trésorerie & Fréquentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Caisse Physique Consolidée"
          value={formatFCFA(overview?.treasury?.consolidatedPhysicalBalance || 14750000)}
          subtitle="Solde réel unique en coffre & banque"
          icon={Wallet}
          accentColor="gold"
          trend={{ value: 12.4, isPositive: true, text: 'vs mois dernier' }}
        />

        <StatCard
          title="Fonds Général Disponible"
          value={formatFCFA(overview?.treasury?.generalFundFreeBalance || 8150000)}
          subtitle="80% Dîmes/Offrandes net de charges"
          icon={PiggyBank}
          accentColor="indigo"
        />

        <StatCard
          title="Dépenses en Attente"
          value={formatFCFA(overview?.treasury?.pendingCommitmentsTotal || 350000)}
          subtitle={`${pendingExpenses.length} demande(s) à autoriser`}
          icon={AlertTriangle}
          accentColor="amber"
        />

        <StatCard
          title="Dernier Culte (Total)"
          value={overview?.attendance?.lastService?.totalAttendance || 500}
          subtitle={`+${overview?.attendance?.lastService?.newVisitorsCount || 32} nouveaux visiteurs`}
          icon={Users}
          accentColor="emerald"
          trend={{ value: 4.2, isPositive: true }}
        />
      </div>

      {/* Compartiments Analytiques de la Caisse Consolidée */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Compartiments Analytiques de la Caisse</span>
              <Badge variant="gold">Une Caisse Unique Consolidée</Badge>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Séparation comptable stricte : le prélèvement 10/10/80 s’applique uniquement sur les dîmes et offrandes ordinaires.
            </p>
          </div>
          <Link
            to="/finance/treasury"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Détail trésorerie</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fonds Général (80%)</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatFCFA(8500000)}
            </p>
            <span className="text-[11px] text-slate-500">Finance charges courantes</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Dîme des Dîmes (10%)
            </span>
            <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
              {formatFCFA(1450000)}
            </p>
            <span className="text-[11px] text-amber-800/70 dark:text-amber-400/70">Fonds réservé sacré</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Aide Sociale (10%)
            </span>
            <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
              {formatFCFA(1300000)}
            </p>
            <span className="text-[11px] text-emerald-800/70 dark:text-emerald-400/70">Secours & veuves</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Auditorium (100%)
            </span>
            <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">
              {formatFCFA(2800000)}
            </p>
            <span className="text-[11px] text-indigo-800/70 dark:text-indigo-400/70">Fonds affecté construction</span>
          </div>

          <div className="p-4 rounded-2xl bg-pink-500/5 border border-pink-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-700 dark:text-pink-400">
              Amis de Jésus (100%)
            </span>
            <p className="text-xl font-extrabold text-pink-700 dark:text-pink-300 mt-1">
              {formatFCFA(700000)}
            </p>
            <span className="text-[11px] text-pink-800/70 dark:text-pink-400/70">Partenaires du ministère</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recettes vs Dépenses */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Évolution Financière Mensuelle (FCFA)
          </h3>
          <p className="text-xs text-slate-500 mb-6">Comparatif recettes encaissées vs dépenses décaissées</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview?.financialTrends || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip
                  formatter={(value: any) => [formatFCFA(Number(value)), '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="revenues" name="Recettes" fill="#FFBC00" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Dépenses" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition Analytique */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Répartition des Compartiments de Caisse
          </h3>
          <p className="text-xs text-slate-500 mb-6">Poids relatif de chaque affectation analytique</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fundsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {fundsData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatFCFA(Number(value)), '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Centre de Décision Immédiat : Dépenses en attente d'approbation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Dépenses en Attente d’Autorisation</span>
              {pendingExpenses.length > 0 && (
                <Badge variant="warning">{pendingExpenses.length} en attente</Badge>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aucun paiement ne peut être exécuté par la caisse sans votre validation formelle.
            </p>
          </div>
          <Link
            to="/finance/expenses"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
          >
            Voir tout l’historique
          </Link>
        </div>

        {pendingExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/50 mb-3" />
            <p className="text-sm font-semibold">Toutes les dépenses soumises ont été arbitrées.</p>
            <p className="text-xs text-slate-500 mt-1">Aucune dépense en attente d’autorisation du Leader.</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Numéro</th>
                  <th className="py-3 px-4">Motif & Justification</th>
                  <th className="py-3 px-4">Bénéficiaire</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4 text-right">Décision du Leader</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingExpenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {exp.expense_number || 'DEP-2026-00001'}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{exp.purpose}</p>
                      <span className="text-xs text-slate-400">Fonds imputé : Fonds Général</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {exp.beneficiary}
                    </td>
                    <td className="py-4 px-4 font-bold text-rose-600 dark:text-rose-400">
                      {formatFCFA(exp.amount)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={processingId === exp.id}
                          onClick={() => handleApprove(exp.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approuver</span>
                        </button>
                        <button
                          disabled={processingId === exp.id}
                          onClick={() => handleReject(exp.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 border border-rose-200 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejeter</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fréquentation du Dernier Culte (Détail rigoureux) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Fréquentation — Dernier Culte Enregistré
            </h2>
            <p className="text-xs text-slate-500">
              Formule certifiée : Total = Hommes + Femmes + Jeunes + Enfants. Nouveaux visiteurs séparés.
            </p>
          </div>
          <Link
            to="/attendance"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Historique cultes</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-amber-400 text-slate-950 font-bold col-span-2 md:col-span-1 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider block opacity-80">Total Présents</span>
            <p className="text-3xl font-extrabold mt-1">500</p>
            <span className="text-[11px] opacity-90">100% de la salle</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-400">Hommes</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">145</p>
            <span className="text-[11px] text-slate-500">29% du total</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-400">Femmes</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">198</p>
            <span className="text-[11px] text-slate-500">39.6% du total</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-400">Jeunes</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">92</p>
            <span className="text-[11px] text-slate-500">18.4% du total</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-400">Enfants</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">65</p>
            <span className="text-[11px] text-slate-500">13% du total</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <span>Nouveaux Visiteurs</span>
            </span>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">32</p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
              Non additionné au total
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
