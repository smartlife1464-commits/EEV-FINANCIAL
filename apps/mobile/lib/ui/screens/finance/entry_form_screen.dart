import 'package:flutter/material.dart';
import '../../../core/platform_config.dart';
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

/// Saisie d'une recette : montant en grand, catégorie, ventilation de l’église calculée en direct.
class EntryFormScreen extends StatefulWidget {
  /// Catégorie présélectionnée (ex. depuis la fiche d'une quête ou d'un compartiment)
  final String? initialCategoryId;
  const EntryFormScreen({super.key, this.initialCategoryId});

  @override
  State<EntryFormScreen> createState() => _EntryFormScreenState();
}

class _EntryFormScreenState extends State<EntryFormScreen> {
  final _amount = TextEditingController();
  final _donor = TextEditingController();
  final _reference = TextEditingController();
  Map<String, dynamic>? _category;
  String _method = 'cash';
  DateTime _date = DateTime.now();
  bool _saving = false;

  int get _value => int.tryParse(_amount.text.replaceAll(RegExp(r'\D'), '')) ?? 0;

  @override
  void dispose() {
    _amount.dispose();
    _donor.dispose();
    _reference.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_value <= 0) return showToast(context, 'Montant requis', kind: ToastKind.error, detail: 'Saisissez un montant supérieur à 0.');
    if (_category == null) return showToast(context, 'Catégorie requise', kind: ToastKind.error);
    final payload = {
      'categoryId': _category!.s('id'),
      'amount': _value,
      'paymentMethod': _method,
      'collectedAt': Fmt.dayIso(_date),
      if (_donor.text.trim().isNotEmpty) 'donorName': _donor.text.trim(),
      if (_reference.text.trim().isNotEmpty) 'reference': _reference.text.trim(),
    };
    setState(() => _saving = true);
    try {
      final r = await Api.createEntry(payload);
      if (!mounted) return;
      context.read<DataBus>().bump();
      HapticFeedback.heavyImpact();
      Navigator.pop(context, true);
      showToast(context, 'Recette ${r.obj('entry').s('entry_number')} enregistrée', detail: 'Ventilation inscrite au grand livre.');
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.isNetwork) {
        await context.read<OfflineQueue>().add(QueueKind.entry, payload, '${_category!.s('name')} • ${Fmt.fcfa(_value)}');
        if (!mounted) return;
        Navigator.pop(context, true);
        showToast(context, 'Enregistrée hors connexion', kind: ToastKind.info, detail: 'Elle sera envoyée au retour du réseau.');
      } else {
        showToast(context, 'Recette refusée', kind: ToastKind.error, detail: e.message);
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
          load: Api.revenueCategories,
          builder: (context, cats, _) {
            // Recettes ordinaires (Dîmes, Offrandes) en tête, puis dons affectés
            const order = ['tithes', 'offerings', 'building', 'friends_of_jesus', 'special_offerings'];
            int rank(Map<String, dynamic> c) {
              final i = order.indexOf(c.s('code'));
              return i < 0 ? order.length : i;
            }
            final active = cats.where((c) => c['is_active'] != false).toList()..sort((a, b) => rank(a).compareTo(rank(b)));
            _category ??= active.firstWhere(
              (c) => widget.initialCategoryId != null ? c.s('id') == widget.initialCategoryId : c.s('code') == 'tithes',
              orElse: () => active.isEmpty ? <String, dynamic>{} : active.first,
            );
            if (_category!.isEmpty) _category = null;
            return _form(context, active);
          },
        ),
      ),
    );
  }

  Widget _form(BuildContext context, List<Map<String, dynamic>> cats) {
    final p = Palette.of(context);
    final cat = _category;
    final split = cat == null
        ? <AllocationLine>[]
        : BusinessRules.allocate(_value, cat.s('allocation_rule'),
            targetFundCode: cat.rel('target_fund').s('code'), targetFundName: cat.rel('target_fund').s('name'));
    final standard = cat?.s('allocation_rule') == BusinessRules.standardSplit;

    return ScrollPage(
      showBack: true,
      title: 'Nouvelle recette',
      subtitle: 'Encaissement certifié',
      children: [
        Gutter(
          child: Container(
            padding: const EdgeInsets.fromLTRB(22, 20, 22, 20),
            decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(30)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('MONTANT BRUT', style: TextStyle(color: Colors.white60, fontWeight: FontWeight.w800, letterSpacing: 1.2, fontSize: 11.5)),
              TextField(
                controller: _amount,
                autofocus: true,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, _ThousandsFormatter()],
                onChanged: (_) => setState(() {}),
                style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w900, letterSpacing: -1),
                decoration: InputDecoration(
                  filled: false,
                  hintText: '0',
                  hintStyle: const TextStyle(color: Colors.white24, fontSize: 40, fontWeight: FontWeight.w900),
                  suffixText: Fmt.currency,
                  suffixStyle: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 18),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 6),
                ),
              ),
              Wrap(spacing: 8, children: [
                for (final v in [5000, 10000, 25000, 50000, 100000])
                  Pressable(
                    onTap: () => setState(() => _amount.text = Fmt.number(_value + v)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      margin: const EdgeInsets.only(top: 6),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                      child: Text('+${Fmt.fcfaCompact(v)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
                    ),
                  ),
              ]),
            ]),
          ),
        ),
        const SectionTitle('Catégorie'),
        Gutter(
          child: Wrap(spacing: 10, runSpacing: 10, children: [
            for (final c in cats)
              Pressable(
                onTap: () => setState(() => _category = c),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: c.s('id') == cat?.s('id') ? AppColors.gold.withValues(alpha: 0.16) : p.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: c.s('id') == cat?.s('id') ? AppColors.gold : p.border, width: c.s('id') == cat?.s('id') ? 1.6 : 1),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(c.s('name'), style: TextStyle(fontWeight: FontWeight.w800, color: p.text, fontSize: 13.5)),
                    Text(c.s('allocation_rule') == BusinessRules.standardSplit ? 'Ventilation ${PlatformConfig.current.splitLabel}' : '100 % affecté',
                        style: TextStyle(color: p.textMuted, fontSize: 11.5)),
                  ]),
                ),
              ),
          ]),
        ),
        const SectionTitle('Ventilation automatique'),
        Gutter(
          child: AppCard(
            child: Column(children: [
              for (final (i, a) in split.indexed) ...[
                Row(children: [
                  Text('${a.percentage} %', style: TextStyle(color: AppColors.chart[i % 8], fontWeight: FontWeight.w900)),
                  const SizedBox(width: 10),
                  Expanded(child: Text(a.label, style: TextStyle(fontWeight: FontWeight.w700, color: p.text))),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Text(Fmt.fcfa(a.amount), key: ValueKey(a.amount), style: TextStyle(fontWeight: FontWeight.w900, color: p.text)),
                  ),
                ]),
                const SizedBox(height: 8),
                ProgressBar(value: a.percentage / 100, color: AppColors.chart[i % 8], height: 6),
                const SizedBox(height: 12),
              ],
              Row(children: [
                Icon(standard ? LucideIcons.info : LucideIcons.lock, size: 14, color: p.textFaint),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    standard ? 'Prélèvements statutaires calculés sur le montant brut.' : 'Don affecté : aucun prélèvement.',
                    style: TextStyle(color: p.textFaint, fontSize: 11.5),
                  ),
                ),
              ]),
            ]),
          ),
        ).animate(key: ValueKey(cat?.s('id'))).fadeIn(duration: 250.ms),
        const SectionTitle('Règlement'),
        ChoiceChips<String>(
          options: [for (final m in paymentMethods.entries) (m.key, m.value.$1)],
          selected: _method,
          onChanged: (v) => setState(() => _method = v),
        ),
        const SizedBox(height: 16),
        Gutter(
          child: Column(children: [
            AppField(controller: _donor, label: 'Donateur (optionnel)', hint: 'Frère / Sœur, famille…', icon: LucideIcons.userRound),
            const SizedBox(height: 14),
            AppField(controller: _reference, label: 'Référence (optionnel)', hint: 'N° Mobile Money, chèque…', icon: LucideIcons.hash),
            const SizedBox(height: 14),
            AppCard(
              padding: const EdgeInsets.all(14),
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now(),
                );
                if (d != null) setState(() => _date = d);
              },
              child: Row(children: [
                const IconChip(LucideIcons.calendarDays, color: AppColors.info, size: 40),
                const SizedBox(width: 12),
                Expanded(child: Text('Date de collecte', style: TextStyle(fontWeight: FontWeight.w700, color: p.textMuted))),
                Text(Fmt.date(Fmt.dayIso(_date), pattern: 'EEE d MMM yyyy'), style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
              ]),
            ),
            const SizedBox(height: 22),
            PrimaryButton(
              label: _value > 0 ? 'Encaisser ${Fmt.fcfa(_value)}' : 'Encaisser',
              icon: LucideIcons.check,
              loading: _saving,
              onPressed: _save,
            ),
          ]),
        ),
      ],
    );
  }
}

/// Séparateur de milliers à la saisie (« 1 250 000 »)
class _ThousandsFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return const TextEditingValue();
    final formatted = Fmt.number(int.parse(digits));
    return TextEditingValue(text: formatted, selection: TextSelection.collapsed(offset: formatted.length));
  }
}
