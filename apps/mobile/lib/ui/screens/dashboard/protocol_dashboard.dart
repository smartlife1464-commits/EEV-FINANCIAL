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
import '../attendance/attendance_form_screen.dart';
import '../attendance/attendance_screen.dart';
import '../shell/home_shell.dart';
import '../../../state/data_bus.dart';
import 'common.dart';

/// Tableau de bord du Département Protocole (aucune donnée financière).
class ProtocolDashboard extends StatelessWidget {
  const ProtocolDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final period = context.watch<Preferences>().period;
    final version = context.watch<DataBus>().version;
    return Loader<Map<String, dynamic>>(
      reloadKey: '$period-$version',
      load: () => Api.attendanceDashboard(period),
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
    final last = d.obj('lastService');
    final sum = d.obj('period_summary');
    final demo = d.list('demographics');
    final byType = d.list('byServiceType').where((t) => t.n('count') > 0).toList();
    final trend = d.list('trend').map((t) => TrendPoint(t.s('label'), t.n('total').toDouble(), t.n('newVisitors').toDouble())).toList();
    final pending = d.i('pendingValidationCount');
    final visitorRate = sum.n('grandTotal') == 0 ? 0 : (sum.n('totalNewVisitors') / sum.n('grandTotal') * 1000).round() / 10;
    const demoColors = {'Hommes': AppColors.info, 'Femmes': AppColors.pink, 'Jeunes': AppColors.gold, 'Enfants': AppColors.success};

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
            eyebrow: last.isEmpty ? 'Dernier culte' : '${last.s('serviceTypeName')} • ${Fmt.date(last.s('date'), pattern: 'EEEE d MMM')}',
            icon: LucideIcons.church,
            value: d.n('lastServiceTotal'),
            format: (v) => '${Fmt.number(v)} fidèles',
            footer: Wrap(spacing: 8, runSpacing: 8, children: [
              for (final (k, label) in [('men', 'H'), ('women', 'F'), ('youth', 'J'), ('children', 'E')])
                _MiniChip('$label ${Fmt.number(last.n(k))}'),
              _MiniChip('✨ ${Fmt.number(last.n('newVisitors'))} visiteurs'),
              if (d['occupancyRate'] != null) _MiniChip('🏛 ${d.n('occupancyRate')} % de la salle'),
            ]),
          ),
          if (pending > 0 && perms.validateAttendance)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: ActionBanner(
                icon: LucideIcons.clipboardCheck,
                color: AppColors.info,
                title: '$pending fiche(s) à valider',
                subtitle: 'Contrôlez et verrouillez les fiches soumises',
                onTap: () => pushPage(context, const AttendanceScreen(standalone: true, initialFilter: 'submitted')),
              ),
            ),
          if (perms.submitAttendance)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: PrimaryButton(
                label: 'Saisir une fiche de présence',
                icon: LucideIcons.clipboardPen,
                onPressed: () => pushPage(context, const AttendanceFormScreen()),
              ),
            ),
          SectionTitle('Bilan • ${d.obj('range').s('label')}'),
          TwoColumns(children: [
            KpiTile(icon: LucideIcons.usersRound, color: AppColors.gold, label: 'Participants cumulés', value: sum.n('grandTotal'), format: Fmt.number,
                    badge: DeltaPill(sum.obj('totalVariation').n('percentage')))
                .entrance(0),
            KpiTile(icon: LucideIcons.userPlus, color: AppColors.info, label: 'Nouveaux visiteurs', value: sum.n('totalNewVisitors'), format: Fmt.number,
                    badge: DeltaPill(sum.obj('visitorsVariation').n('percentage')))
                .entrance(1),
            KpiTile(icon: LucideIcons.church, color: AppColors.violet, label: 'Cultes enregistrés', value: sum.n('servicesCount'), format: Fmt.number,
                    caption: 'Moy. ${Fmt.number(sum.n('averagePerService'))} / culte')
                .entrance(2),
            KpiTile(icon: LucideIcons.heartHandshake, color: AppColors.pink, label: 'Décisions pour Christ', value: sum.n('totalSalvations'), format: Fmt.number,
                    caption: 'Taux de visiteurs : ${Fmt.percent(visitorRate)}')
                .entrance(3),
          ]),
          const SectionTitle('Évolution de l\'affluence'),
          Gutter(
            child: AppCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const LegendDot(color: AppColors.gold, label: 'Participants'),
                  const SizedBox(width: 14),
                  const LegendDot(color: AppColors.info, label: 'Visiteurs'),
                ]),
                const SizedBox(height: 12),
                AreaTrendChart(points: trend, colorB: AppColors.info, format: (v) => '${v.round()}', height: 170),
              ]),
            ),
          ),
          const SectionTitle('Répartition démographique'),
          Gutter(
            child: AppCard(
              child: Row(children: [
                DonutChart(
                  size: 132,
                  centerValue: Fmt.compact(sum.n('grandTotal')),
                  centerLabel: 'participants',
                  slices: [for (final x in demo) DonutSlice(x.s('name'), x.n('count').toDouble(), demoColors[x.s('name')] ?? AppColors.gold)],
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(children: [
                    for (final x in demo)
                      LegendRow(color: demoColors[x.s('name')] ?? AppColors.gold, label: x.s('name'), value: '${Fmt.number(x.n('count'))} • ${x.i('percentage')} %'),
                  ]),
                ),
              ]),
            ),
          ),
          if (byType.isNotEmpty) ...[
            const SectionTitle('Par programme'),
            for (final (i, t) in byType.indexed)
              RowTile(
                icon: programIcon(t.s('code')),
                color: AppColors.chart[i % 8],
                title: t.s('type'),
                subtitle: '${t.i('count')} culte(s) • moyenne ${Fmt.number(t.n('average'))}',
                trailing: Fmt.number(t.n('total')),
              ).entrance(i),
          ],
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 18, 24, 0),
            child: Text('Total = hommes + femmes + jeunes + enfants. Les nouveaux visiteurs sont comptés à part.',
                textAlign: TextAlign.center, style: TextStyle(color: p.textFaint, fontSize: 11.5)),
          ),
          const SizedBox(height: 130),
        ],
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  final String text;
  const _MiniChip(this.text);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
        child: Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
      );
}

class LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const LegendDot({super.key, required this.color, required this.label});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 9, height: 9, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: Palette.of(context).textMuted, fontWeight: FontWeight.w700, fontSize: 12)),
      ]);
}
