import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/rules.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../data/offline_queue.dart';
import '../../../state/data_bus.dart';
import '../../kit/kit.dart';

/// Assistant de saisie d'une fiche de présence en 3 étapes : programme → effectifs → validation.
class AttendanceFormScreen extends StatefulWidget {
  const AttendanceFormScreen({super.key});

  @override
  State<AttendanceFormScreen> createState() => _AttendanceFormScreenState();
}

class _AttendanceFormScreenState extends State<AttendanceFormScreen> {
  int _step = 0;
  String? _slug;
  DateTime _date = DateTime.now();
  TimeOfDay _start = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _end = const TimeOfDay(hour: 12, minute: 0);
  int _men = 0, _women = 0, _youth = 0, _children = 0, _visitors = 0, _salvations = 0;
  final _notes = TextEditingController();
  bool _saving = false;

  int get _total => BusinessRules.attendanceTotal(men: _men, women: _women, youth: _youth, children: _children);

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  void _selectProgram(String slug) {
    setState(() {
      _slug = slug;
      if (slug.startsWith('tuesday') || slug.startsWith('thursday')) {
        _start = const TimeOfDay(hour: 18, minute: 0);
        _end = const TimeOfDay(hour: 20, minute: 30);
      } else if (slug == 'sunday_service_1') {
        _start = const TimeOfDay(hour: 7, minute: 30);
        _end = const TimeOfDay(hour: 10, minute: 0);
      } else if (slug == 'sunday_service_2') {
        _start = const TimeOfDay(hour: 10, minute: 30);
        _end = const TimeOfDay(hour: 13, minute: 0);
      }
    });
  }

  String _hhmm(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> _submit({required bool draft, bool allowDuplicate = false}) async {
    final payload = {
      'serviceTypeSlug': _slug,
      'serviceDate': Fmt.dayIso(_date),
      'startTime': _hhmm(_start),
      'endTime': _hhmm(_end),
      'menCount': _men,
      'womenCount': _women,
      'youthCount': _youth,
      'childrenCount': _children,
      'newVisitorsCount': _visitors,
      'salvationsCount': _salvations,
      'notes': _notes.text.trim(),
      'isDraft': draft,
      if (allowDuplicate) 'allowDuplicate': true,
    };
    setState(() => _saving = true);
    try {
      await Api.createSheet(payload);
      if (!mounted) return;
      context.read<DataBus>().bump();
      HapticFeedback.heavyImpact();
      Navigator.pop(context, true);
      showToast(context, draft ? 'Brouillon enregistré' : 'Fiche transmise', detail: draft ? null : 'Le Responsable Protocole va la valider.');
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 409) {
        final ok = await confirmAction(
          context,
          title: 'Fiche déjà existante',
          message: '${e.message}\n\nS\'agit-il d\'un culte dédoublé ou d\'une session spéciale ?',
          confirmLabel: 'Enregistrer quand même',
          icon: LucideIcons.copy,
        );
        if (ok) await _submit(draft: draft, allowDuplicate: true);
      } else if (e.isNetwork) {
        await context.read<OfflineQueue>().add(QueueKind.sheet, payload, 'Fiche du ${Fmt.date(Fmt.dayIso(_date))} • $_total participants');
        if (!mounted) return;
        Navigator.pop(context, true);
        showToast(context, 'Fiche gardée hors connexion', kind: ToastKind.info, detail: 'Elle sera envoyée au retour du réseau.');
      } else {
        showToast(context, 'Fiche refusée', kind: ToastKind.error, detail: e.message);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: Loader<List<Map<String, dynamic>>>(
          load: Api.serviceTypes,
          builder: (context, types, _) => _content(context, types),
        ),
      ),
    );
  }

  Widget _content(BuildContext context, List<Map<String, dynamic>> types) {
    final p = Palette.of(context);
    const titles = ['Quel culte ?', 'Effectifs', 'Vérification'];
    final canNext = _step == 0 ? _slug != null : (_step == 1 ? _total > 0 : true);
    final programName = types.where((t) => t.s('slug') == _slug).firstOrNull?.s('name') ?? '';

    return Column(children: [
      Expanded(
        child: ScrollPage(
          showBack: true,
          title: titles[_step],
          subtitle: 'Fiche de présence • étape ${_step + 1}/3',
          children: [
            Gutter(
              child: Row(children: [
                for (var i = 0; i < 3; i++)
                  Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 350),
                      height: 6,
                      margin: EdgeInsets.only(right: i < 2 ? 6 : 0),
                      decoration: BoxDecoration(
                        gradient: i <= _step ? AppColors.goldGradient : null,
                        color: i <= _step ? null : p.border,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
              ]),
            ),
            const SizedBox(height: 18),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 350),
              transitionBuilder: (c, a) => FadeTransition(
                opacity: a,
                child: SlideTransition(position: Tween(begin: const Offset(0.06, 0), end: Offset.zero).animate(a), child: c),
              ),
              child: KeyedSubtree(
                key: ValueKey(_step),
                child: switch (_step) {
                  0 => _programStep(context, types),
                  1 => _countStep(context),
                  _ => _reviewStep(context, programName),
                },
              ),
            ),
          ],
        ),
      ),
      Glass(
        radius: 0,
        padding: EdgeInsets.fromLTRB(20, 14, 20, 14 + MediaQuery.of(context).padding.bottom),
        child: Row(children: [
          if (_step > 0) ...[
            SizedBox(width: 110, child: SecondaryButton(label: 'Retour', onPressed: () => setState(() => _step--))),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: _step < 2
                ? PrimaryButton(
                    label: _step == 1 ? 'Vérifier · $_total' : 'Continuer',
                    icon: LucideIcons.arrowRight,
                    onPressed: canNext ? () => setState(() => _step++) : null,
                  )
                : PrimaryButton(label: 'Transmettre la fiche', icon: LucideIcons.send, loading: _saving, onPressed: () => _submit(draft: false)),
          ),
        ]),
      ),
    ]);
  }

  Widget _programStep(BuildContext context, List<Map<String, dynamic>> types) {
    final p = Palette.of(context);
    return Column(children: [
      for (final (i, t) in types.indexed)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
          child: Pressable(
            onTap: () => _selectProgram(t.s('slug')),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: t.s('slug') == _slug ? AppColors.gold.withValues(alpha: 0.14) : p.surface,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: t.s('slug') == _slug ? AppColors.gold : p.border, width: t.s('slug') == _slug ? 1.6 : 1),
              ),
              child: Row(children: [
                IconChip(programIcon(t.s('slug')), color: AppColors.chart[i % 8], size: 44),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(t.s('name'), style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
                    Text(t.s('description'), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: p.textMuted, fontSize: 12)),
                  ]),
                ),
                AnimatedScale(
                  scale: t.s('slug') == _slug ? 1 : 0,
                  duration: const Duration(milliseconds: 220),
                  child: const Icon(LucideIcons.circleCheck, color: AppColors.gold),
                ),
              ]),
            ),
          ),
        ).entrance(i),
      const SizedBox(height: 10),
      Gutter(
        child: Row(children: [
          Expanded(
            child: _PickerTile(
              icon: LucideIcons.calendarDays,
              label: 'Date',
              value: Fmt.date(Fmt.dayIso(_date), pattern: 'EEE d MMM'),
              onTap: () async {
                final d = await showDatePicker(context: context, initialDate: _date, firstDate: DateTime(2024), lastDate: DateTime.now());
                if (d != null) setState(() => _date = d);
              },
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _PickerTile(
              icon: LucideIcons.clock,
              label: 'Horaire',
              value: '${_hhmm(_start)} – ${_hhmm(_end)}',
              onTap: () async {
                final s = await showTimePicker(context: context, initialTime: _start, helpText: 'Heure de début');
                if (s == null || !context.mounted) return;
                final e = await showTimePicker(context: context, initialTime: _end, helpText: 'Heure de fin');
                setState(() {
                  _start = s;
                  if (e != null) _end = e;
                });
              },
            ),
          ),
        ]),
      ),
    ]);
  }

  Widget _countStep(BuildContext context) {
    final p = Palette.of(context);
    return Column(children: [
      Gutter(
        child: AppCard(
          gradient: AppColors.heroGradient,
          child: Row(children: [
            const IconChip(LucideIcons.usersRound, color: AppColors.gold, filled: true, size: 52),
            const SizedBox(width: 16),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('TOTAL PARTICIPANTS', style: TextStyle(color: Colors.white60, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1)),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Text('$_total', key: ValueKey(_total), style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900)),
                ),
              ]),
            ),
            const Text('H + F + J + E', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.w800, fontSize: 12)),
          ]),
        ),
      ),
      const SizedBox(height: 12),
      for (final (i, (label, icon, color, value, set)) in [
        ('Hommes', LucideIcons.user, AppColors.info, _men, (int v) => _men = v),
        ('Femmes', LucideIcons.userRound, AppColors.pink, _women, (int v) => _women = v),
        ('Jeunes', LucideIcons.sparkles, AppColors.gold, _youth, (int v) => _youth = v),
        ('Enfants', LucideIcons.baby, AppColors.success, _children, (int v) => _children = v),
      ].indexed)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
          child: CounterStepper(label: label, icon: icon, color: color, value: value, onChanged: (v) => setState(() => set(v))),
        ).entrance(i),
      Padding(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 6),
        child: Row(children: [
          Text('Indicateurs spirituels', style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
          const SizedBox(width: 8),
          Text('(hors total)', style: TextStyle(color: p.textFaint, fontSize: 12)),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
        child: CounterStepper(label: 'Nouveaux visiteurs', icon: LucideIcons.userPlus, color: AppColors.violet, value: _visitors, onChanged: (v) => setState(() => _visitors = v)),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
        child: CounterStepper(
            label: 'Décisions pour Christ', icon: LucideIcons.heartHandshake, color: AppColors.danger, value: _salvations, onChanged: (v) => setState(() => _salvations = v)),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(22, 10, 22, 0),
        child: Text('Astuce : appui long sur + ou − pour ajouter ou retirer 10.', style: TextStyle(color: p.textFaint, fontSize: 12)),
      ),
    ]);
  }

  Widget _reviewStep(BuildContext context, String programName) {
    final p = Palette.of(context);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Gutter(
        child: AppCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              IconChip(programIcon(_slug ?? ''), color: AppColors.gold, size: 46),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(programName, style: TextStyle(fontWeight: FontWeight.w900, color: p.text, fontSize: 16)),
                  Text('${Fmt.date(Fmt.dayIso(_date), pattern: 'EEEE d MMMM yyyy')} • ${_hhmm(_start)} – ${_hhmm(_end)}',
                      style: TextStyle(color: p.textMuted, fontSize: 12.5)),
                ]),
              ),
            ]),
            const SizedBox(height: 16),
            Center(
              child: DonutChart(
                size: 150,
                centerValue: '$_total',
                centerLabel: 'participants',
                slices: [
                  DonutSlice('Hommes', _men.toDouble(), AppColors.info),
                  DonutSlice('Femmes', _women.toDouble(), AppColors.pink),
                  DonutSlice('Jeunes', _youth.toDouble(), AppColors.gold),
                  DonutSlice('Enfants', _children.toDouble(), AppColors.success),
                ],
              ),
            ).animate().scale(curve: Curves.easeOutBack, duration: 500.ms),
            const SizedBox(height: 14),
            LegendRow(color: AppColors.info, label: 'Hommes', value: '$_men'),
            LegendRow(color: AppColors.pink, label: 'Femmes', value: '$_women'),
            LegendRow(color: AppColors.gold, label: 'Jeunes', value: '$_youth'),
            LegendRow(color: AppColors.success, label: 'Enfants', value: '$_children'),
            const Divider(height: 22),
            LegendRow(color: AppColors.violet, label: 'Nouveaux visiteurs', value: '$_visitors'),
            LegendRow(color: AppColors.danger, label: 'Décisions pour Christ', value: '$_salvations'),
          ]),
        ),
      ),
      const SizedBox(height: 14),
      Gutter(child: AppField(controller: _notes, label: 'Observations (optionnel)', hint: 'Faits marquants, témoignages…', icon: LucideIcons.notebookPen, maxLines: 3)),
      Center(
        child: TextButton.icon(
          onPressed: _saving ? null : () => _submit(draft: true),
          icon: const Icon(LucideIcons.save, size: 16),
          label: const Text('Enregistrer comme brouillon', style: TextStyle(fontWeight: FontWeight.w700)),
        ),
      ),
    ]);
  }
}

class _PickerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  const _PickerTile({required this.icon, required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Icon(icon, size: 18, color: p.accent),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: TextStyle(color: p.textMuted, fontSize: 11.5, fontWeight: FontWeight.w700)),
            Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
          ]),
        ),
      ]),
    );
  }
}
