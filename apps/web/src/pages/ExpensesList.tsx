import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatFCFA, formatDate } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { UserRole, ExpenseStatus, PaymentMethod } from '@eev/shared-types';
import {
  ArrowUpCircle,
  Plus,
  Printer,
  X,
  Receipt,
  FileCheck,
  Search,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Repeat,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  PieChart,
  SlidersHorizontal,
  PauseCircle,
  PlayCircle,
  Eye,
  Check,
  Building,
  Droplet,
  Zap,
  Wifi,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ExpensesList: React.FC = () => {
  const { user } = useAuth();
  const canApprove = [UserRole.LEAD_PASTOR, UserRole.ADMIN].includes(user?.role as UserRole);
  const canPay = [UserRole.FINANCE_LEAD, UserRole.CASHIER, UserRole.ADMIN].includes(user?.role as UserRole);
  const canCreate = [UserRole.FINANCE_LEAD, UserRole.ADMIN, UserRole.CASHIER].includes(user?.role as UserRole);

  // Onglet principal : 'fixed' (Charges fixes) | 'variable' (Dépenses variables) | 'projections' (Prévisions)
  const [activeTab, setActiveTab] = useState<'fixed' | 'variable' | 'projections'>('fixed');

  // Queries
  const { data: fixedExpenses = [], refetch: refetchFixed } = useQuery({
    queryKey: ['fixed-expenses'],
    queryFn: () => api.getFixedExpenses(),
  });

  const { data: occurrences = [], refetch: refetchOccurrences } = useQuery({
    queryKey: ['fixed-expense-occurrences'],
    queryFn: () => api.getFixedExpenseOccurrences(),
  });

  const { data: fixedSummary } = useQuery({
    queryKey: ['fixed-expenses-summary'],
    queryFn: () => api.getFixedExpensesSummary(),
  });

  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses(),
  });

  const { data: budgets = [], refetch: refetchBudgets } = useQuery({
    queryKey: ['expense-budgets'],
    queryFn: () => api.getExpenseBudgets(),
  });

  const { data: projections } = useQuery({
    queryKey: ['cash-projections'],
    queryFn: () => api.getCashProjections(),
  });

  const { data: funds = [] } = useQuery({
    queryKey: ['funds'],
    queryFn: () => api.getFunds(),
  });

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [voucherExpense, setVoucherExpense] = useState<any | null>(null);
  const [payingItem, setPayingItem] = useState<{
    type: 'fixed_occurrence' | 'variable_expense';
    id: string;
    title: string;
    beneficiary: string;
    amount: number;
    fundName: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'mobile_money'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // État formulaire Création Charge Fixe
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedCategory, setNewFixedCategory] = useState('Loyer');
  const [newFixedAmount, setNewFixedAmount] = useState<number>(150000);
  const [newFixedFrequency, setNewFixedFrequency] = useState('monthly');
  const [newFixedDueDay, setNewFixedDueDay] = useState<number>(5);
  const [newFixedStartDate, setNewFixedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newFixedFundId, setNewFixedFundId] = useState(funds[0]?.id || '');
  const [newFixedBeneficiary, setNewFixedBeneficiary] = useState('');
  const [newFixedNotes, setNewFixedNotes] = useState('');
  const [submittingFixed, setSubmittingFixed] = useState(false);

  // État formulaire Création Dépense Variable
  const [newVarTitle, setNewVarTitle] = useState('');
  const [newVarCategory, setNewVarCategory] = useState('Transport');
  const [newVarAmount, setNewVarAmount] = useState<number>(25000);
  const [newVarFundId, setNewVarFundId] = useState(funds[0]?.id || '');
  const [newVarBeneficiary, setNewVarBeneficiary] = useState('');
  const [newVarPurpose, setNewVarPurpose] = useState('');
  const [submittingVar, setSubmittingVar] = useState(false);

  // État formulaire Budget Variable
  const [budgetCat, setBudgetCat] = useState('Transport');
  const [budgetAmount, setBudgetAmount] = useState<number>(100000);
  const [budgetThreshold, setBudgetThreshold] = useState<number>(80);
  const [submittingBudget, setSubmittingBudget] = useState(false);

  // Traitements d'actions
  const handleToggleFixedStatus = async (id: string) => {
    try {
      await api.toggleFixedExpenseStatus(id);
      await refetchFixed();
      await refetchOccurrences();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleGenerateOccurrences = async () => {
    try {
      const res = await api.generateFixedExpenseOccurrences();
      alert(res.message || 'Échéances générées avec succès sans doublon.');
      await refetchOccurrences();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la génération.');
    }
  };

  const handleApproveOccurrence = async (occId: string, decision: 'approve' | 'reject') => {
    try {
      await api.approveFixedExpenseOccurrence(occId, decision);
      await refetchOccurrences();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du traitement.');
    }
  };

  const handlePayOccurrence = (occ: any) => {
    setPaymentMethod('cash');
    setPaymentReference('');
    setPayingItem({
      type: 'fixed_occurrence',
      id: occ.id,
      title: occ.expand?.fixed_expense?.name || occ.name || 'Charge Récurrente',
      beneficiary: occ.expand?.fixed_expense?.beneficiary || occ.beneficiary || 'Bailleur / Fournisseur',
      amount: occ.amount || occ.reserved_amount || occ.expand?.fixed_expense?.amount || 0,
      fundName: "80% Fonds Général (Charges d'exploitation)",
    });
  };

  const handlePayVariable = (exp: any) => {
    setPaymentMethod('cash');
    setPaymentReference('');
    setPayingItem({
      type: 'variable_expense',
      id: exp.id,
      title: exp.purpose || exp.expense_number,
      beneficiary: exp.beneficiary,
      amount: exp.amount || 0,
      fundName: exp.expand?.fund_account?.name || '80% Fonds Général',
    });
  };

  const executeDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem) return;
    setSubmittingPayment(true);
    try {
      if (payingItem.type === 'fixed_occurrence') {
        await api.payFixedExpenseOccurrence(payingItem.id, paymentMethod, paymentReference || undefined);
        await refetchOccurrences();
      } else {
        await api.payExpense(payingItem.id, paymentMethod as any, paymentReference || undefined);
      }
      await refetchExpenses();
      const disbursed = { ...payingItem };
      setPayingItem(null);
      // Afficher le bon de caisse officiel imprimable
      setVoucherExpense({
        expense_number: `DEC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        created: new Date().toISOString(),
        beneficiary: disbursed.beneficiary,
        amount: disbursed.amount,
        purpose: disbursed.title,
      });
    } catch (err: any) {
      alert(err.message || 'Erreur lors du décaissement.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCreateFixed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFixedName || newFixedAmount <= 0) {
      alert('Veuillez renseigner un nom et un montant valide.');
      return;
    }
    setSubmittingFixed(true);
    try {
      await api.createFixedExpense({
        name: newFixedName,
        category: newFixedCategory,
        amount: newFixedAmount,
        currency: 'XAF',
        frequency: newFixedFrequency,
        dueDay: newFixedDueDay,
        startDate: newFixedStartDate,
        fundAccountId: newFixedFundId || funds[0]?.id,
        beneficiary: newFixedBeneficiary || 'Fournisseur désigné',
        notes: newFixedNotes,
        status: 'active',
      });
      setShowFixedModal(false);
      setNewFixedName('');
      await refetchFixed();
      await refetchOccurrences();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création.');
    } finally {
      setSubmittingFixed(false);
    }
  };

  const handleCreateVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVarAmount <= 0 || !newVarBeneficiary || !newVarPurpose) {
      alert('Veuillez renseigner un montant, un bénéficiaire et un motif.');
      return;
    }
    setSubmittingVar(true);
    try {
      await api.createExpense({
        categoryId: 'expcat-variable',
        category_name: newVarCategory,
        fundAccountId: newVarFundId || funds[0]?.id,
        amount: newVarAmount,
        beneficiary: newVarBeneficiary,
        purpose: `${newVarTitle ? newVarTitle + ' : ' : ''}${newVarPurpose}`,
      });
      setShowVariableModal(false);
      setNewVarTitle('');
      setNewVarBeneficiary('');
      setNewVarPurpose('');
      await refetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la dépense.');
    } finally {
      setSubmittingVar(false);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBudget(true);
    try {
      const now = new Date();
      const pStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const pEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`;
      await api.createExpenseBudget({
        category: budgetCat,
        amount: budgetAmount,
        periodType: 'monthly',
        periodStart: pStart,
        periodEnd: pEnd,
        alertThreshold: budgetThreshold,
        status: 'active',
      });
      setShowBudgetModal(false);
      await refetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement du budget.');
    } finally {
      setSubmittingBudget(false);
    }
  };



  // Badge Statut de Couverture
  const getCoverageBadge = (status: string, shortage: number = 0) => {
    switch (status) {
      case 'covered':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Couverte (100%)</span>
          </span>
        );
      case 'partially_covered':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Partielle (Manque {formatFCFA(shortage)})</span>
          </span>
        );
      case 'uncovered':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Non couverte</span>
          </span>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOccurrenceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            Réglée
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Approuvée
          </span>
        );
      case 'overdue':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">
            En retard
          </span>
        );
      case 'due_soon':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
            Échéance proche
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-500/15 text-slate-400 border border-slate-500/30">
            À venir
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* En-tête Général */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-500 border border-rose-500/25">
              Finances & Décaissements
            </span>
            <span className="text-xs text-slate-400">• Gestion Intelligente</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <ArrowUpCircle className="w-6 h-6 text-rose-500" />
            <span>Gestion des Dépenses & Prévisions de Trésorerie</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distinction stricte entre charges fixes régulières, dépenses variables et suivi des capacités de couverture.
          </p>
        </div>

        {/* Boutons d'action rapides */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'fixed' && (
            <>
              <button
                onClick={handleGenerateOccurrences}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                <Repeat className="w-4 h-4 text-amber-500" />
                <span>Générer Échéances</span>
              </button>
              {canCreate && (
                <button
                  onClick={() => setShowFixedModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Configurer Charge Fixe</span>
                </button>
              )}
            </>
          )}

          {activeTab === 'variable' && canCreate && (
            <>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                <span>Fixer un Plafond Budget</span>
              </button>
              <button
                onClick={() => setShowVariableModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-400/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Dépense Variable</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation par Onglets Principaux */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#16214A] pb-2">
        <button
          onClick={() => setActiveTab('fixed')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black transition-all cursor-pointer ${
            activeTab === 'fixed'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 translate-y-[-1px]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Repeat className="w-4.5 h-4.5" />
          <span>1. Charges Fixes & Prévisionnelles</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-950/15 text-slate-950 font-mono font-bold">
            {fixedExpenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('variable')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black transition-all cursor-pointer ${
            activeTab === 'variable'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 translate-y-[-1px]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4.5 h-4.5" />
          <span>2. Dépenses Variables & Plafonds</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-950/15 text-slate-950 font-mono font-bold">
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('projections')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black transition-all cursor-pointer ${
            activeTab === 'projections'
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 translate-y-[-1px]'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4.5 h-4.5" />
          <span>3. Prévisions & Capacité de Couverture</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1 : CHARGES FIXES ET RÉCURRENTES
      ========================================================================= */}
      {activeTab === 'fixed' && (
        <div className="space-y-6">
          {/* KPI Cards Synthèse des Charges Fixes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Charges Fixes / Mois
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatFCFA(fixedSummary?.totalMonthlyFixed || 225000)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Loyer, électricité, eau, internet & récurrents
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Provision Mensuelle Équivalente
              </span>
              <div className="text-3xl font-black text-amber-500 mt-1">
                {formatFCFA(fixedSummary?.monthlyEquivalentProvision || 225000)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Trimestre/3 + Semestre/6 + Année/12
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Échéances à Venir (Horizon)
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatFCFA(fixedSummary?.upcomingOccurrencesTotal || 225000)}
              </div>
              <p className="text-xs text-blue-400 font-bold mt-1">
                {occurrences.filter((o: any) => o.status !== 'paid').length} échéance(s) prévues
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm card-hover-effect">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Taux de Couverture des Charges
              </span>
              <div className="text-3xl font-black text-emerald-500 mt-1">
                {fixedSummary?.coverageRate || 100}%
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                Capacité financière vérifiée sur 80% Général
              </p>
            </div>
          </div>

          {/* Grille des charges fixes configurées */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Configuration des Charges Périodiques
                </h3>
                <p className="text-xs text-slate-400">
                  Définies et reconnues par le Ministère pour la planification automatique.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fixedExpenses.map((fe: any) => (
                <div
                  key={fe.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    fe.status === 'active'
                      ? 'bg-slate-50 dark:bg-[#080E25] border-slate-200 dark:border-[#16214A]'
                      : 'bg-slate-100/50 dark:bg-white/5 border-dashed border-slate-300 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                      {fe.category}
                    </span>
                    <button
                      onClick={() => handleToggleFixedStatus(fe.id)}
                      title={fe.status === 'active' ? 'Suspendre la charge' : 'Réactiver la charge'}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {fe.status === 'active' ? (
                        <PauseCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <PlayCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </button>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">{fe.name}</h4>
                  <div className="text-lg font-black text-amber-500 mt-0.5">{formatFCFA(fe.amount)}</div>

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#16214A] space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>Périodicité : <strong className="text-slate-700 dark:text-slate-300 uppercase">{fe.frequency}</strong></div>
                    <div>Échéance : le <strong className="text-slate-700 dark:text-slate-300">{fe.due_day || 5}</strong> du mois</div>
                    <div>Bénéficiaire : {fe.beneficiary || 'Non spécifié'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau des Échéances à Venir avec Statuts de Couverture */}
          <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#16214A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span>Calendrier Intelligent des Échéances & Statuts de Couverture</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vérification simultanée de la disponibilité physique réelle et de la disponibilité du fonds analytique autorisé.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{occurrences.length} échéance(s) au planning</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#080E25] text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                    <th className="py-4 px-6">Charge / Bénéficiaire</th>
                    <th className="py-4 px-6">Date d'Échéance</th>
                    <th className="py-4 px-6">Montant Dû</th>
                    <th className="py-4 px-6">Fonds Analytique</th>
                    <th className="py-4 px-6">Capacité de Couverture</th>
                    <th className="py-4 px-6">Statut</th>
                    <th className="py-4 px-6 text-right">Décaissement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]">
                  {occurrences.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        Aucune échéance générée. Cliquez sur "Générer Échéances" pour initialiser le calendrier.
                      </td>
                    </tr>
                  ) : (
                    occurrences.map((occ: any) => {
                      const expName = occ.fixed_expense?.name || 'Charge récurrente';
                      const beneficiary = occ.fixed_expense?.beneficiary || 'Bénéficiaire';
                      return (
                        <tr key={occ.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-900 dark:text-white block">{expName}</span>
                            <span className="text-[11px] text-slate-400">{beneficiary}</span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {formatDate(occ.due_date)}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-black text-slate-900 dark:text-white">
                            {formatFCFA(occ.expected_amount)}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            {occ.fund_account?.name || '80% Fonds Général'}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            {getCoverageBadge(occ.coverage_status, occ.shortage_amount)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            {getOccurrenceStatusBadge(occ.status)}
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            {occ.status === 'paid' ? (
                              <span className="text-xs font-bold text-emerald-500">✓ Réglé</span>
                            ) : occ.status === 'approved' && canPay ? (
                              <button
                                onClick={() => handlePayOccurrence(occ)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                              >
                                Payer Maintenant
                              </button>
                            ) : occ.status !== 'approved' && canApprove ? (
                              <button
                                onClick={() => handleApproveOccurrence(occ.id, 'approve')}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                              >
                                Approuver
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">En attente d'accord</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2 : DÉPENSES VARIABLES ET SUIVI DES BUDGETS
      ========================================================================= */}
      {activeTab === 'variable' && (
        <div className="space-y-6">
          {/* Suivi Budgétaire des Catégories Variables */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-500" />
                  <span>Plafonds & Consommation des Budgets Variables</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Alertes automatiques activées dès 80% puis 100% de consommation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {budgets.map((b: any) => {
                const isWarning = b.consumption_rate >= 80 && b.consumption_rate < 100;
                const isOver = b.consumption_rate >= 100;
                return (
                  <div
                    key={b.id || b.category}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{b.category}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOver
                            ? 'bg-rose-500/20 text-rose-500'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-emerald-500/20 text-emerald-500'
                        }`}
                      >
                        {b.consumption_rate}% consommé
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-400">Budget prévu :</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatFCFA(b.amount)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#16214A] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, b.consumption_rate)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Restant : <strong className="text-slate-700 dark:text-slate-300">{formatFCFA(b.remaining_amount)}</strong></span>
                      {isOver && <span className="text-rose-500 font-bold">⚠️ Dépassement</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tableau des Dépenses Variables */}
          <div className="bg-white dark:bg-[#0C1530] rounded-3xl border border-slate-200 dark:border-[#16214A] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#16214A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Historique des Dépenses Variables & Ponctuelles
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Workflow strict : Saisie -&gt; Accord Leader Principal -&gt; Paiement et Sortie Physique.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Rechercher bénéficiaire, motif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#080E25] text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-[#16214A]">
                    <th className="py-4 px-6">N° Dépense</th>
                    <th className="py-4 px-6">Catégorie & Motif</th>
                    <th className="py-4 px-6">Bénéficiaire</th>
                    <th className="py-4 px-6">Montant</th>
                    <th className="py-4 px-6">Statut</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#16214A]">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Aucune dépense variable enregistrée.
                      </td>
                    </tr>
                  ) : (
                    expenses
                      .filter((e: any) =>
                        (e.beneficiary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (e.purpose || '').toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500">
                            {exp.expense_number}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {exp.category_name || exp.category?.name || 'Variable'}
                            </span>
                            <span className="text-xs text-slate-400 line-clamp-1">{exp.purpose}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-800 dark:text-slate-200 font-medium">
                            {exp.beneficiary}
                          </td>
                          <td className="py-4 px-6 font-black text-slate-900 dark:text-white">
                            {formatFCFA(exp.amount)}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            {exp.status === 'paid' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                                Payée
                              </span>
                            ) : exp.status === 'approved' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                                Approuvée
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                                En attente
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {exp.status === 'approved' && canPay && (
                                <button
                                  onClick={() => handlePayVariable(exp)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                                >
                                  Payer
                                </button>
                              )}
                              <button
                                onClick={() => setVoucherExpense(exp)}
                                title="Bon officiel de décaissement"
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#16214A] dark:hover:bg-[#1E2C60] text-slate-800 dark:text-slate-200 transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3 : PRÉVISIONS & CAPACITÉ DE COUVERTURE (30, 60, 90 JOURS)
      ========================================================================= */}
      {activeTab === 'projections' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0C1530] border border-slate-200 dark:border-[#16214A] shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                Moteur de Prévision de Trésorerie
              </span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Projections Prudentielles à 30, 60 et 90 Jours
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Distinction nette : Solde physique réel ({formatFCFA(projections?.currentPhysicalCash || 14750000)}) vs Engagements analytiques ({formatFCFA(projections?.currentPendingCommitments || 350000)}) vs Solde projeté.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {(projections?.projections || []).map((proj: any) => (
                <div
                  key={proj.label}
                  className="p-6 rounded-3xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                      Horizon {proj.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Modèle Prudentiel</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#16214A]">
                      <span className="text-slate-400">Solde Réel Actuel :</span>
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {formatFCFA(proj.startingCash)}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#16214A]">
                      <span className="text-slate-400">+ Recettes Prévisionnelles :</span>
                      <strong className="text-emerald-500 font-mono">+{formatFCFA(proj.forecastInflows)}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#16214A]">
                      <span className="text-slate-400">- Charges & Décaissements :</span>
                      <strong className="text-rose-500 font-mono">-{formatFCFA(proj.scheduledOutflows)}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 uppercase">Solde Projeté</span>
                      <div className="text-xl font-black text-slate-900 dark:text-white">
                        {formatFCFA(proj.projectedBalance)}
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL : CONFIGURATION D'UNE CHARGE FIXE
      ========================================================================= */}
      {showFixedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0C1530] text-slate-900 dark:text-white max-w-xl w-full rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#16214A] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Nouvelle Charge Fixe Récurrente
                </h3>
                <p className="text-xs text-slate-400">
                  Définissez la périodicité et l'échéance pour la génération automatique du planning.
                </p>
              </div>
              <button onClick={() => setShowFixedModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFixed} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Intitulé de la charge *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Loyer Sanctuaire Principal, Abonnement Fibre Optique..."
                  value={newFixedName}
                  onChange={(e) => setNewFixedName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Catégorie *</label>
                  <select
                    value={newFixedCategory}
                    onChange={(e) => setNewFixedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Loyer">Loyer</option>
                    <option value="Eau">Eau</option>
                    <option value="Électricité">Électricité</option>
                    <option value="Internet">Internet</option>
                    <option value="Abonnements">Abonnements</option>
                    <option value="Entretien récurrent">Entretien récurrent</option>
                    <option value="Autres charges régulières">Autres charges régulières</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Montant Habituel (XAF) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newFixedAmount}
                    onChange={(e) => setNewFixedAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs font-bold outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Périodicité *</label>
                  <select
                    value={newFixedFrequency}
                    onChange={(e) => setNewFixedFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="semiannual">Semestrielle</option>
                    <option value="annual">Annuelle</option>
                    <option value="weekly">Hebdomadaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Jour d'échéance (1 à 28) *</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={newFixedDueDay}
                    onChange={(e) => setNewFixedDueDay(parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Fonds Analytique Autorisé *</label>
                  <select
                    value={newFixedFundId}
                    onChange={(e) => setNewFixedFundId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {funds.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Bénéficiaire ou Fournisseur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bailleur, ENEO, Camwater..."
                    value={newFixedBeneficiary}
                    onChange={(e) => setNewFixedBeneficiary(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#16214A]">
                <button
                  type="button"
                  onClick={() => setShowFixedModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingFixed}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25"
                >
                  {submittingFixed ? 'Enregistrement...' : 'Enregistrer la Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL : NOUVELLE DÉPENSE VARIABLE
      ========================================================================= */}
      {showVariableModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0C1530] text-slate-900 dark:text-white max-w-xl w-full rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-[#16214A] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Nouvelle Dépense Variable
                </h3>
                <p className="text-xs text-slate-400">
                  Enregistrement comptable en attente d'approbation par le Pasteur Principal.
                </p>
              </div>
              <button onClick={() => setShowVariableModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVariable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Catégorie prédéfinie *</label>
                <select
                  value={newVarCategory}
                  onChange={(e) => setNewVarCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Transport">Transport</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Aide">Aide</option>
                  <option value="Logistique">Logistique</option>
                  <option value="Santé">Santé</option>
                  <option value="Communication">Communication</option>
                  <option value="Matériel">Matériel</option>
                  <option value="Entretien exceptionnel">Entretien exceptionnel</option>
                  <option value="Évangélisation">Évangélisation</option>
                  <option value="Mission">Mission</option>
                  <option value="Hébergement">Hébergement</option>
                  <option value="Formation">Formation</option>
                  <option value="Événements">Événements</option>
                  <option value="Autres dépenses">Autres dépenses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Montant (XAF) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newVarAmount}
                    onChange={(e) => setNewVarAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs font-bold outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Bénéficiaire *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nom du bénéficiaire"
                    value={newVarBeneficiary}
                    onChange={(e) => setNewVarBeneficiary(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Motif / Justification détaillée *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Expliquez la nécessité de la dépense..."
                  value={newVarPurpose}
                  onChange={(e) => setNewVarPurpose(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#16214A]">
                <button
                  type="button"
                  onClick={() => setShowVariableModal(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingVar}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25"
                >
                  {submittingVar ? 'Enregistrement...' : 'Soumettre pour Accord'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL : CONFIGURATION BUDGET VARIABLE
      ========================================================================= */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0C1530] text-slate-900 dark:text-white max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-[#16214A] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Définir un Plafond Budgétaire Mensuel
              </h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Catégorie</label>
                <select
                  value={budgetCat}
                  onChange={(e) => setBudgetCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs"
                >
                  <option value="Transport">Transport</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Aide">Aide</option>
                  <option value="Logistique">Logistique</option>
                  <option value="Santé">Santé</option>
                  <option value="Communication">Communication</option>
                  <option value="Matériel">Matériel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Plafond Prévu (XAF)</label>
                <input
                  type="number"
                  min="1"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Seuil d'alerte (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={budgetThreshold}
                  onChange={(e) => setBudgetThreshold(parseInt(e.target.value) || 80)}
                  className="w-full px-3 py-2 rounded-2xl bg-slate-50 dark:bg-[#080E25] border border-slate-200 dark:border-[#16214A] text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-[#16214A] text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingBudget}
                  className="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs"
                >
                  {submittingBudget ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL : DÉCAISSEMENT OFFICIEL DE CAISSE (PAIEMENT)
      ========================================================================= */}
      {payingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C1530] text-slate-900 dark:text-slate-100 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-[#16214A] shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#16214A] pb-3">
              <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs uppercase tracking-wider">
                <Receipt className="w-4 h-4" />
                <span>Bordereau de Décaissement</span>
              </div>
              <button onClick={() => setPayingItem(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Montant Total à Décaisser
              </span>
              <div className="text-3xl font-black text-amber-500 dark:text-amber-400">
                {formatFCFA(payingItem.amount)}
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {payingItem.title}
              </p>
            </div>

            <form onSubmit={executeDisbursement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Bénéficiaire désigné
                </label>
                <div className="mt-1 p-2.5 rounded-xl bg-slate-100 dark:bg-[#060D24] text-xs font-semibold">
                  {payingItem.beneficiary}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Imputation Analytique
                </label>
                <div className="mt-1 p-2.5 rounded-xl bg-slate-100 dark:bg-[#060D24] text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {payingItem.fundName}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Mode de Décaissement *
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-amber-400 bg-amber-400/15 text-amber-500 font-extrabold'
                        : 'border-slate-200 dark:border-[#16214A] text-slate-400'
                    }`}
                  >
                    💵 Espèces
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-amber-400 bg-amber-400/15 text-amber-500 font-extrabold'
                        : 'border-slate-200 dark:border-[#16214A] text-slate-400'
                    }`}
                  >
                    🏦 Virement
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      paymentMethod === 'mobile_money'
                        ? 'border-amber-400 bg-amber-400/15 text-amber-500 font-extrabold'
                        : 'border-slate-200 dark:border-[#16214A] text-slate-400'
                    }`}
                  >
                    📱 Mobile
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  N° de Pièce / Quittance / Référence (optionnel)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ex: QUITT-2026-088 ou TX-99238"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#060D24] border border-slate-200 dark:border-[#16214A] text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#16214A]">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#16214A] text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingPayment ? 'Décaissement...' : 'Valider & Décaisser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL : BON OFFICIEL DE DÉCAISSEMENT IMPRIMABLE
      ========================================================================= */}
      {voucherExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 max-w-xl w-full rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 relative print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <span className="text-xs font-bold uppercase text-amber-600">
                Bon de Décaissement • Ministère Esprit & Vie
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
                <button onClick={() => setVoucherExpense(null)} className="p-2 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <img src="/logo-eev.png" alt="Esprit & Vie" className="w-12 h-12 object-contain" />
                <div>
                  <h2 className="text-base font-black uppercase text-slate-900">Ministère Esprit & Vie</h2>
                  <p className="text-[11px] text-slate-500">Service de Caisse & Trésorerie</p>
                  <p className="text-xs font-bold text-rose-600 uppercase mt-0.5">
                    Bon Officiel de Décaissement Caisse
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">N° {voucherExpense.expense_number}</p>
                <p className="text-slate-500">Date : {formatDate(voucherExpense.created || voucherExpense.expense_date)}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-100">
                <div>
                  <span className="text-slate-500">Bénéficiaire :</span>
                  <p className="font-bold text-sm text-slate-900">{voucherExpense.beneficiary}</p>
                </div>
                <div>
                  <span className="text-slate-500">Montant Décaissé :</span>
                  <p className="font-black text-base text-rose-600">{formatFCFA(voucherExpense.amount)}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Motif de la dépense :</span>
                <p className="font-semibold text-slate-900 mt-0.5">{voucherExpense.purpose}</p>
              </div>

              <div>
                <span className="text-slate-500">Imputation Analytique :</span>
                <p className="font-semibold text-slate-900">80% Fonds Général (Fonctionnement)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200 text-[11px] text-center">
              <div>
                <p className="font-bold">L'Émetteur</p>
                <div className="h-12 border-b border-dashed border-slate-400 mt-2" />
              </div>
              <div>
                <p className="font-bold">Le Pasteur Principal (Visa)</p>
                <div className="h-12 border-b border-dashed border-slate-400 mt-2" />
              </div>
              <div>
                <p className="font-bold">Le Caissier (Paiement)</p>
                <div className="h-12 border-b border-dashed border-slate-400 mt-2" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
