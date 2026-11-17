import 'package:flutter/material.dart';
import '../../../core/platform_config.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../state/preferences.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../finance/entry_form_screen.dart';
import '../finance/expense_form_screen.dart';
import '../shell/home_shell.dart';
import '../../../state/data_bus.dart';
import 'common.dart';

/// Tableau de bord Finances & Caisse (Responsable Finances, Caissier).
class FinanceDashboardScreen extends StatelessWidget {
  const FinanceDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final period = context.watch<Preferences>().period;
    final version = context.watch<DataBus>().version;
    return Loader<Map<String, dynamic>>(
      reloadKey: '$period-$version',
      load: () => Api.financeDashboard(period),
      skeleton: const SingleChildScrollView(
        child: Column(children: [DashboardHeader(), PeriodBar(), SizedBox(height: 16), SkeletonList(hero: true)]),
      ),
      builder: (context, d, reload) => _Body(d: d, reload: reload),
    );
  }
}

class _Body extends StatelessWidget {
  final Map<String, dynamic> d;
  final Future<void> Function() reload;
  const _Body({required this.d, required this.reload});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final perms = context.read<Session>().user!.permissions;
    final splitLines = d.list('splitBreakdown');
    final trend = d.list('trend').map((t) => TrendPoint(t.s('label'), t.n('revenues').toDouble(), t.n('expenses').toDouble())).toList();
    final byCat = d.list('revenueByCategory');
    final expCat = d.list('expensesByCategory');
    final net = d.n('netCashFlow');

    return RefreshIndicator(
      onRefresh: reload,
      color: AppColors.navy,
      backgroundColor: AppColors.gold,
      child: ListView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        padding: EdgeInsets.zero,
        children: [
          const DashboardHeader(),
          const PeriodBar(),
          const SizedBox(height: 18),
          HeroCard(
            eyebrow: 'Recettes • ${d.obj('range').s('label')}',
            icon: LucideIcons.handCoins,
            value: d.n('totalRevenueMonth'),
            format: Fmt.fcfa,
            trailing: DeltaPill(d.obj('revenueVariation').n('percentage'), onDark: true),
            footer: Text('${d.i('entriesCount')} encaissement(s) • Caisse : ${Fmt.fcfa(d.n('consolidatedCash'))}',
                style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, fontSize: 13)),
            chart: AreaTrendChart(points: trend, colorB: AppColors.danger.withValues(alpha: 0.85), height: 120, onDark: true),
          ),
          const SizedBox(height: 16),
          Gutter(
            child: Row(children: [
              if (perms.createEntry)
                Expanded(
                  child: SecondaryButton(
                    label: 'Recette',
                    icon: LucideIcons.plus,
                    color: AppColors.success,
                    onPressed: () => pushPage(context, const EntryFormScreen()),
                  ),
                ),
              if (perms.createEntry && perms.createExpense) const SizedBox(width: 10),
              if (perms.createExpense)
                Expanded(
                  child: SecondaryButton(
                    label: 'Dépense',
                    icon: LucideIcons.plus,
                    color: AppColors.danger,
                    onPressed: () => pushPage(context, const ExpenseFormScreen()),
                  ),
                ),
            ]),
          ),
          const SectionTitle('Synthèse de la période'),
          TwoColumns(children: [
            KpiTile(icon: LucideIcons.arrowUpRight, color: AppColors.danger, label: 'Dépenses payées', value: d.n('totalExpensesMonth'), format: Fmt.fcfaCompact,
                    badge: DeltaPill(d.obj('expensesVariation').n('percentage'), favorableWhenUp: false))
                .entrance(0),
            KpiTile(icon: LucideIcons.trendingUp, color: net >= 0 ? AppColors.success : AppColors.danger, label: 'Flux net', value: net, format: Fmt.fcfaCompact,
                    caption: net >= 0 ? 'Excédent' : 'Déficit')
                .entrance(1),
            KpiTile(icon: LucideIcons.piggyBank, color: AppColors.info, label: 'Fonds Général disponible', value: d.n('generalFundAvailable'), format: Fmt.fcfaCompact)
                .entrance(2),
            KpiTile(icon: LucideIcons.hourglass, color: AppColors.warning, label: 'En attente d\'accord', value: d.n('pendingApprovalCount'), format: Fmt.number,
                    caption: 'Engagements : ${Fmt.fcfaCompact(d.n('pendingCommitments'))}')
                .entrance(3),
          ]),
          SectionTitle('Ventilation ${PlatformConfig.current.splitLabel}'),
          Gutter(
            child: AppCard(
              child: Column(children: [
                for (final (i, l) in splitLines.indexed) ...[
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: _splitColor(i).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                      child: Text('${l.i('percentage')} %', style: TextStyle(color: _splitColor(i), fontWeight: FontWeight.w900, fontSize: 12)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: Text(l.s('label', l.s('fundCode')), style: TextStyle(fontWeight: FontWeight.w700, color: p.text))),
                    Text(Fmt.fcfa(l.n('amount')), style: TextStyle(fontWeight: FontWeight.w900, color: p.text)),
                  ]),
                  const SizedBox(height: 8),
                  ProgressBar(value: l.n('percentage') / 100, color: _splitColor(i)),
                  const SizedBox(height: 14),
                ],
                Text('Calculée sur les dîmes et offrandes ordinaires brutes. Les dons affectés sont crédités à 100 %.',
                    style: TextStyle(color: p.textFaint, fontSize: 11.5, height: 1.4)),
              ]),
            ),
          ),
          const SectionTitle('Compartiments de la caisse'),
          FundsCarousel(funds: d.list('funds')),
          if (byCat.isNotEmpty) ...[
            const SectionTitle('Recettes par catégorie'),
            Gutter(
              child: AppCard(
                child: Row(children: [
                  DonutChart(
                    size: 128,
                    centerValue: Fmt.fcfaCompact(d.n('totalRevenueMonth')),
                    centerLabel: Fmt.currency,
                    slices: [for (final (i, c) in byCat.indexed) DonutSlice(c.s('name'), c.n('amount').toDouble(), AppColors.chart[i % 8])],
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(children: [
                      for (final (i, c) in byCat.indexed)
                        LegendRow(color: AppColors.chart[i % 8], label: c.s('name'), value: '${c.i('percentage')} %'),
                    ]),
                  ),
                ]),
              ),
            ),
          ],
          if (expCat.isNotEmpty) ...[
            const SectionTitle('Dépenses par catégorie'),
            for (final (i, c) in expCat.indexed)
              RowTile(
                icon: LucideIcons.receipt,
                color: AppColors.chart[i % 8],
                title: c.s('name'),
                subtitle: '${c.i('percentage')} % des décaissements',
                trailing: Fmt.fcfaCompact(c.n('amount')),
              ).entrance(i),
          ],
          const SizedBox(height: 130),
        ],
      ),
    );
  }
}

Color _splitColor(int i) => const [AppColors.info, AppColors.gold, AppColors.success, AppColors.pink, AppColors.violet][i % 5];
