import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../state/notifications.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../shell/home_shell.dart';
import '../../../state/data_bus.dart';
import 'attendance_form_screen.dart';

/// Registre des fiches de présence : filtres, détail, validation à 4 yeux.
class AttendanceScreen extends StatefulWidget {
  final bool standalone;
  final String initialFilter;
  const AttendanceScreen({super.key, this.standalone = false, this.initialFilter = 'all'});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  late String _filter = widget.initialFilter;
  int _reload = 0;

  Future<(List<Map<String, dynamic>>, Map<String, String>)> _load() async {
    final r = await Future.wait([Api.attendanceSheets(), Api.serviceTypes()]);
    return (r[0], {for (final t in r[1]) t.s('slug'): t.s('name')});
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<Session>().user!;
    final version = context.watch<DataBus>().version;
    final body = Loader<(List<Map<String, dynamic>>, Map<String, String>)>(
      reloadKey: '$_reload-$version',
      load: _load,
      builder: (context, data, reload) {
        final (sheets, names) = data;
        final list = sheets.where((s) => _filter == 'all' || s.s('status') == _filter).toList();
        final total = list.fold<num>(0, (a, s) => a + s.n('total_attendance'));
        final visitors = list.fold<num>(0, (a, s) => a + s.n('new_visitors_count'));
        int count(String st) => sheets.where((s) => s.s('status') == st).length;
        return ScrollPage(
          showBack: widget.standalone,
          title: 'Fréquentation',
          subtitle: '${list.length} fiche(s) • ${Fmt.number(total)} participants • +${Fmt.number(visitors)} visiteurs',
          onRefresh: reload,
          actions: [
            if (user.permissions.submitAttendance)
              RoundIconButton(
                icon: LucideIcons.plus,
                tooltip: 'Nouvelle fiche',
                onTap: () async {
                  final ok = await pushPage<bool>(context, const AttendanceFormScreen());
                  if (ok == true) setState(() => _reload++);
                },
              ),
          ],
          children: [
            ChoiceChips<String>(
              options: [
                ('all', 'Toutes (${sheets.length})'),
                ('submitted', 'À valider (${count('submitted')})'),
                ('validated', 'Validées (${count('validated')})'),
                ('rejected', 'Rejetées (${count('rejected')})'),
                ('draft', 'Brouillons (${count('draft')})'),
              ],
              selected: _filter,
              onChanged: (v) => setState(() => _filter = v),
            ),
            const SizedBox(height: 10),
            if (list.isEmpty)
              EmptyState(
                icon: LucideIcons.clipboardList,
                title: 'Aucune fiche',
                message: 'Aucune fiche de présence ne correspond à ce filtre.',
                action: user.permissions.submitAttendance
                    ? SizedBox(
                        width: 230,
                        child: PrimaryButton(
                          label: 'Saisir une fiche',
                          icon: LucideIcons.plus,
                          onPressed: () => pushPage(context, const AttendanceFormScreen()),
                        ),
                      )
                    : null,
              ),
            for (final (i, s) in list.indexed)
              _SheetTile(
                sheet: s,
                programName: names[s.s('service_type_slug')] ?? s.rel('service_type').s('name', s.s('service_type_slug')),
                canValidate: user.permissions.validateAttendance && s.s('status') == 'submitted' && (s.rel('submitted_by')['id'] ?? s['submitted_by']) != user.id,
                onChanged: () => setState(() => _reload++),
              ).entrance(i),
          ],
        );
      },
    );
    return widget.standalone ? Scaffold(body: AuroraBackground(child: body)) : body;
  }
}

class _SheetTile extends StatelessWidget {
  final Map<String, dynamic> sheet;
  final String programName;
  final bool canValidate;
  final VoidCallback onChanged;
  const _SheetTile({required this.sheet, required this.programName, required this.canValidate, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final st = StatusStyle.sheet(sheet.s('status'));
    final total = sheet.n('total_attendance');
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: AppCard(
        padding: const EdgeInsets.all(16),
        borderColor: canValidate ? AppColors.info.withValues(alpha: 0.5) : null,
        onTap: () => _openDetail(context),
        child: Column(children: [
          Row(children: [
            IconChip(programIcon(sheet.s('service_type_slug')), color: AppColors.gold, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(programName, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w800, color: p.text, fontSize: 15)),
                Text('${Fmt.date(sheet.s('service_date'), pattern: 'EEEE d MMM yyyy')} • ${sheet.s('start_time')}',
                    style: TextStyle(color: p.textMuted, fontSize: 12.5)),
              ]),
            ),
            StatusPill(st.label, color: st.color, icon: st.icon),
          ]),
          const SizedBox(height: 14),
          _DemographicBar(sheet: sheet),
          const SizedBox(height: 10),
          Row(children: [
            Text('${Fmt.number(total)} participants', style: TextStyle(fontWeight: FontWeight.w900, color: p.text)),
            const Spacer(),
            Icon(LucideIcons.userPlus, size: 14, color: AppColors.info),
            const SizedBox(width: 4),
            Text('${sheet.i('new_visitors_count')}', style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.info)),
            const SizedBox(width: 12),
            const Icon(LucideIcons.heartHandshake, size: 14, color: AppColors.pink),
            const SizedBox(width: 4),
            Text('${sheet.i('salvations_count')}', style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.pink)),
          ]),
          if (canValidate) ...[
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: SecondaryButton(label: 'Renvoyer', icon: LucideIcons.undo2, color: AppColors.danger, onPressed: () => _decide(context, 'reject'))),
              const SizedBox(width: 10),
              Expanded(child: PrimaryButton(label: 'Valider', icon: LucideIcons.badgeCheck, onPressed: () => _decide(context, 'validate'))),
            ]),
          ],
        ]),
      ),
    );
  }

  Future<void> _decide(BuildContext context, String decision) async {
    String? reason;
    if (decision == 'reject') {
      reason = await askReason(context, title: 'Renvoyer la fiche', hint: 'Correction attendue de l\'agent');
      if (reason == null) return;
    }
    try {
      await Api.decideSheet(sheet.s('id'), decision, reason: reason);
      if (!context.mounted) return;
      context.read<NotificationsCenter>().refresh();
      context.read<DataBus>().bump();
      showToast(context, decision == 'validate' ? 'Fiche validée et verrouillée' : 'Fiche renvoyée pour correction');
      onChanged();
    } on ApiException catch (e) {
      if (context.mounted) showToast(context, 'Action impossible', kind: ToastKind.error, detail: e.message);
    }
  }

  void _openDetail(BuildContext context) {
    showAppSheet<void>(context, builder: (ctx) {
      final p = Palette.of(ctx);
      final rows = [
        ('Hommes', 'men_count', AppColors.info, LucideIcons.user),
        ('Femmes', 'women_count', AppColors.pink, LucideIcons.userRound),
        ('Jeunes', 'youth_count', AppColors.gold, LucideIcons.sparkles),
        ('Enfants', 'children_count', AppColors.success, LucideIcons.baby),
      ];
      return SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(22, 16, 22, 22),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(programName, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: p.text)),
          Text('${Fmt.date(sheet.s('service_date'), pattern: 'EEEE d MMMM yyyy')} • ${sheet.s('start_time')} – ${sheet.s('end_time')}',
              style: TextStyle(color: p.textMuted)),
          const SizedBox(height: 18),
          Center(
            child: DonutChart(
              size: 160,
              centerValue: Fmt.number(sheet.n('total_attendance')),
              centerLabel: 'participants',
              slices: [for (final r in rows) DonutSlice(r.$1, sheet.n(r.$2).toDouble(), r.$3)],
            ),
          ),
          const SizedBox(height: 16),
          for (final r in rows) LegendRow(color: r.$3, label: r.$1, value: Fmt.number(sheet.n(r.$2))),
          const Divider(height: 24),
          LegendRow(color: AppColors.info, label: 'Nouveaux visiteurs (hors total)', value: Fmt.number(sheet.n('new_visitors_count'))),
          LegendRow(color: AppColors.pink, label: 'Décisions pour Christ', value: Fmt.number(sheet.n('salvations_count'))),
          if (sheet.s('notes').isNotEmpty) ...[
            const SizedBox(height: 14),
            Text('Observations', style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
            const SizedBox(height: 6),
            Text(sheet.s('notes'), style: TextStyle(color: p.textMuted, height: 1.45)),
          ],
          const SizedBox(height: 14),
          Text('Saisie par ${sheet.rel('submitted_by').s('name', '—')}${sheet.rel('validated_by').s('name').isNotEmpty ? ' • validée par ${sheet.rel('validated_by').s('name')}' : ''}',
              style: TextStyle(color: p.textFaint, fontSize: 12)),
        ]),
      );
    });
  }
}

/// Barre empilée Hommes / Femmes / Jeunes / Enfants
class _DemographicBar extends StatelessWidget {
  final Map<String, dynamic> sheet;
  const _DemographicBar({required this.sheet});

  @override
  Widget build(BuildContext context) {
    final parts = [
      (sheet.n('men_count'), AppColors.info),
      (sheet.n('women_count'), AppColors.pink),
      (sheet.n('youth_count'), AppColors.gold),
      (sheet.n('children_count'), AppColors.success),
    ];
    final total = parts.fold<num>(0, (a, p) => a + p.$1);
    if (total == 0) return const ProgressBar(value: 0);
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: SizedBox(
        height: 8,
        child: Row(children: [
          for (final part in parts)
            if (part.$1 > 0) Expanded(flex: (part.$1 * 1000 ~/ total).clamp(1, 1000), child: Container(color: part.$2)),
        ]),
      ),
    );
  }
}
