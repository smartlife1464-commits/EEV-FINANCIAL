import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../state/preferences.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../finance/approvals_screen.dart';
import '../shell/home_shell.dart';
import '../../../state/data_bus.dart';
import 'common.dart';

/// Tableau de bord exécutif (Pasteur Principal, Administration, Audit).
class LeaderDashboard extends StatelessWidget {
  const LeaderDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final period = context.watch<Preferences>().period;
    final version = context.watch<DataBus>().version;
    return Loader<Map<String, dynamic>>(
      reloadKey: '$period-$version',
      load: () => Api.overview(period),
      skeleton: const _Skeleton(),
      builder: (context, d, reload) => _Body(data: d, reload: reload),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();
  @override
  Widget build(BuildContext context) => const SingleChildScrollView(
        child: Column(children: [DashboardHeader(), PeriodBar(), SizedBox(height: 16), SkeletonList(hero: true)]),
      );
}

class _Body extends StatelessWidget {
  final Map<String, dynamic> data;
  final Future<void> Function() reload;
  const _Body({required this.data, required this.reload});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final user = context.read<Session>().user!;
    final treasury = data.obj('treasury');
    final fin = data.obj('finance');
    final att = data.obj('attendance');
    final last = att.obj('lastService');
    final pending = data.i('pendingApprovalsCount');
    final trend = fin.list('trend').map((t) => TrendPoint(t.s('label'), t.n('revenues').toDouble(), t.n('expenses').toDouble())).toList();
    final byType = att.list('byServiceType').where((t) => t.n('total') > 0).toList();

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
            eyebrow: 'Caisse consolidée',
            value: treasury.n('consolidatedPhysicalBalance'),
            format: Fmt.fcfa,
            trailing: DeltaPill(fin.obj('revenuesVariation').n('percentage'), onDark: true),
            footer: Text(
              'Recettes ${data.obj('range').s('label').toLowerCase()} : ${Fmt.fcfa(fin.n('revenues'))}',
              style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, fontSize: 13),
            ),
            chart: AreaTrendChart(points: trend, colorB: AppColors.danger.withValues(alpha: 0.8), height: 120, onDark: true),
          ),
          if (pending > 0 && user.permissions.approveExpense)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: ActionBanner(
                icon: LucideIcons.badgeCheck,
                color: AppColors.gold,
                title: '$pending dépense(s) à arbitrer',
                subtitle: '${Fmt.fcfa(data.n('pendingApprovalsTotalAmount'))} en attente de votre décision',
                onTap: () => pushPage(context, const ApprovalsScreen()),
              ),
            ),
          const SectionTitle('Indicateurs clés'),
          TwoColumns(children: [
            KpiTile(
              icon: LucideIcons.usersRound,
              color: AppColors.gold,
              label: 'Fidèles au dernier culte',
              value: last.n('totalAttendance'),
              format: Fmt.number,
              caption: last.isEmpty ? 'Aucune fiche' : '${last.s('name')} • ${Fmt.date(last.s('date'), pattern: 'd MMM')}',
            ).entrance(0),
            KpiTile(
              icon: LucideIcons.userPlus,
              color: AppColors.info,
              label: 'Nouveaux visiteurs',
              value: att.n('newVisitors'),
              format: Fmt.number,
              badge: DeltaPill(_pct(att.n('newVisitors'), att.n('previousNewVisitors'))),
            ).entrance(1),
            KpiTile(
              icon: LucideIcons.church,
              color: AppColors.violet,
              label: 'Cultes tenus',
              value: att.n('servicesCount'),
              format: Fmt.number,
              caption: 'Moy. ${Fmt.number(att.n('averagePerService'))} participants',
            ).entrance(2),
            KpiTile(
              icon: LucideIcons.heartHandshake,
              color: AppColors.pink,
              label: 'Décisions pour Christ',
              value: att.n('salvations'),
              format: Fmt.number,
            ).entrance(3),
            KpiTile(
              icon: LucideIcons.arrowUpRight,
              color: AppColors.danger,
              label: 'Dépenses payées',
              value: fin.n('expensesPaid'),
              format: Fmt.fcfaCompact,
              caption: '${fin.i('approvedCount')} autorisée(s) • ${fin.i('rejectedCount')} rejetée(s)',
            ).entrance(4),
            KpiTile(
              icon: LucideIcons.piggyBank,
              color: AppColors.success,
              label: 'Fonds Général libre',
              value: treasury.n('generalFundFreeBalance'),
              format: Fmt.fcfaCompact,
              caption: 'Après ${Fmt.fcfaCompact(treasury.n('pendingCommitmentsTotal'))} d\'engagements',
            ).entrance(5),
          ]),
          const SectionTitle('Compartiments de la caisse'),
          FundsCarousel(funds: treasury.list('funds')),
          const SectionTitle('Fréquentation par programme'),
          Gutter(
            child: AppCard(
              child: byType.isEmpty
                  ? const EmptyState(icon: LucideIcons.church, title: 'Aucune fiche', message: 'Aucune fiche de présence sur la période.')
                  : Row(children: [
                      DonutChart(
                        size: 132,
                        centerValue: Fmt.compact(att.n('periodTotal')),
                        centerLabel: 'participants',
                        slices: [
                          for (final (i, t) in byType.indexed)
                            DonutSlice(t.s('type'), t.n('total').toDouble(), AppColors.chart[i % AppColors.chart.length]),
                        ],
                      ),
                      const SizedBox(width: 18),
                      Expanded(
                        child: Column(children: [
                          for (final (i, t) in byType.take(5).indexed)
                            LegendRow(color: AppColors.chart[i % AppColors.chart.length], label: t.s('type'), value: '${t.i('percentage')} %'),
                        ]),
                      ),
                    ]),
            ),
          ),
          if (fin.list('revenueByCategory').isNotEmpty) ...[
            const SectionTitle('Origine des recettes'),
            Gutter(
              child: AppCard(
                child: Column(children: [
                  for (final (i, c) in fin.list('revenueByCategory').indexed) ...[
                    Row(children: [
                      Expanded(child: Text(c.s('name'), style: TextStyle(fontWeight: FontWeight.w700, color: p.text))),
                      Text(Fmt.fcfa(c.n('amount')), style: TextStyle(fontWeight: FontWeight.w900, color: p.text)),
                    ]),
                    const SizedBox(height: 8),
                    ProgressBar(value: c.n('percentage') / 100, color: AppColors.chart[i % AppColors.chart.length]),
                    const SizedBox(height: 14),
                  ],
                ]),
              ),
            ),
          ],
          const SectionTitle('Activité récente'),
          ActivityFeed(items: data.list('recentActivity')),
          const SizedBox(height: 130),
        ],
      ),
    );
  }

  static num _pct(num cur, num prev) => prev == 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev * 1000).round() / 10;
}
