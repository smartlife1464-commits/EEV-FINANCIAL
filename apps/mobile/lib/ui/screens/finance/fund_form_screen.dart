import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../state/data_bus.dart';
import '../../kit/kit.dart';
import 'fund_style.dart';

/// Création d'un compartiment permanent ou d'une quête spontanée (somme à atteindre + délai).
/// Avec [existing], modifie / prolonge une quête (une nouvelle date limite rouvre une quête clôturée).
class FundFormScreen extends StatefulWidget {
  final String initialKind;
  final Map<String, dynamic>? existing;
  const FundFormScreen({super.key, this.initialKind = 'campaign', this.existing});

  @override
  State<FundFormScreen> createState() => _FundFormScreenState();
}

class _FundFormScreenState extends State<FundFormScreen> {
  late String _kind = widget.existing?.s('kind', 'campaign') ?? widget.initialKind;
  late final _name = TextEditingController(text: widget.existing?.s('name') ?? '');
  late final _description = TextEditingController(text: widget.existing?.s('description') ?? '');
  late final _target = TextEditingController(
      text: (widget.existing?.n('targetAmount') ?? 0) > 0 ? Fmt.number(widget.existing!.n('targetAmount')) : '');
  late DateTime _endDate = Fmt.parse(widget.existing?.s('endDate')) ?? DateUtils.dateOnly(DateTime.now()).add(const Duration(days: 13));
  bool _restricted = true;
  late Color _color = FundStyle.parseColor(widget.existing?.s('color') ?? '') ?? (_kind == 'campaign' ? const Color(0xFFF97316) : AppColors.cyan);
  bool _saving = false;

  bool get _editing => widget.existing != null;
  bool get _campaign => _kind == 'campaign';
  int get _targetValue => int.tryParse(_target.text.replaceAll(RegExp(r'\D'), '')) ?? 0;
  int get _days => _endDate.difference(DateUtils.dateOnly(DateTime.now())).inDays + 1;

  @override
  void initState() {
    super.initState();
    // Aperçu mis à jour à chaque frappe
    _name.addListener(() => setState(() {}));
    _target.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _target.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    String? error;
    if (_name.text.trim().length < 3) {
      error = 'Donnez un nom d\'au moins 3 caractères.';
    } else if (_campaign && _targetValue <= 0) {
      error = 'Indiquez la somme à atteindre.';
    } else if (_campaign && _days < 1) {
      error = 'La date limite doit être aujourd\'hui ou plus tard.';
    }
    if (error != null) return showToast(context, 'Formulaire incomplet', kind: ToastKind.error, detail: error);

    setState(() => _saving = true);
    try {
      final hex = FundStyle.toHex(_color);
      if (_editing) {
        final reopen = widget.existing!.s('status') == 'closed';
        await Api.updateFund(widget.existing!.s('id'), {
          'name': _name.text.trim(),
          'description': _description.text.trim(),
          if (_campaign) 'targetAmount': _targetValue,
          if (_campaign) 'endDate': Fmt.dayIso(_endDate),
          'color': hex,
          if (reopen) 'status': 'active',
        });
      } else {
        await Api.createFund({
          'name': _name.text.trim(),
          'description': _description.text.trim(),
          'kind': _kind,
          'isRestricted': _campaign ? true : _restricted,
          'color': hex,
          if (_campaign) 'targetAmount': _targetValue,
          if (_campaign) 'startDate': Fmt.dayIso(DateTime.now()),
          if (_campaign) 'endDate': Fmt.dayIso(_endDate),
        });
      }
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      context.read<DataBus>().bump();
      Navigator.pop(context, true);
      showToast(
        context,
        _editing ? 'Quête mise à jour' : (_campaign ? 'Quête lancée 🎯' : 'Compartiment créé'),
        detail: _editing ? null : 'Une catégorie de recette dédiée permet d\'y encaisser les dons (100 % affectés).',
      );
    } on ApiException catch (e) {
      if (mounted) showToast(context, 'Enregistrement impossible', kind: ToastKind.error, detail: e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Scaffold(
      body: AuroraBackground(
        child: ScrollPage(
          showBack: true,
          title: _editing ? 'Modifier la quête' : (_campaign ? 'Nouvelle quête' : 'Nouveau compartiment'),
          subtitle: _editing ? widget.existing!.s('name') : 'Structure de la caisse',
          children: [
            if (!_editing)
              Gutter(
                child: Row(children: [
                  Expanded(
                    child: _KindCard(
                      selected: _campaign,
                      icon: LucideIcons.target,
                      title: 'Quête spontanée',
                      subtitle: 'Temporaire, avec objectif et délai',
                      color: const Color(0xFFF97316),
                      onTap: () => setState(() {
                        _kind = 'campaign';
                        _color = const Color(0xFFF97316);
                      }),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _KindCard(
                      selected: !_campaign,
                      icon: LucideIcons.piggyBank,
                      title: 'Compartiment',
                      subtitle: 'Fonds durable de la caisse',
                      color: AppColors.cyan,
                      onTap: () => setState(() {
                        _kind = 'permanent';
                        _color = AppColors.cyan;
                      }),
                    ),
                  ),
                ]),
              ),
            const SizedBox(height: 18),
            _Preview(name: _name.text, campaign: _campaign, target: _targetValue, days: _days, color: _color),
            const SizedBox(height: 18),
            Gutter(
              child: Column(children: [
                AppField(
                  controller: _name,
                  label: _campaign ? 'Nom de la quête' : 'Nom du compartiment',
                  hint: _campaign ? 'Ex : Sonorisation de la croisade' : 'Ex : Fonds Jeunesse',
                  icon: _campaign ? LucideIcons.target : LucideIcons.piggyBank,
                ),
                const SizedBox(height: 14),
                AppField(
                  controller: _description,
                  label: 'Description (optionnel)',
                  hint: 'À quoi servira cet argent ?',
                  icon: LucideIcons.messageSquareText,
                  maxLines: 3,
                ),
                if (_campaign) ...[
                  const SizedBox(height: 14),
                  AppField(
                    controller: _target,
                    label: 'Somme à atteindre (FCFA)',
                    hint: 'Ex : 1 500 000',
                    icon: LucideIcons.goal,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, _Thousands()],
                  ),
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    for (final v in [250000, 500000, 1000000, 2500000, 5000000])
                      Pressable(
                        onTap: () => setState(() => _target.text = Fmt.number(v)),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                          decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: p.border)),
                          child: Text(Fmt.fcfaCompact(v), style: TextStyle(fontWeight: FontWeight.w800, color: p.text, fontSize: 12.5)),
                        ),
                      ),
                  ]),
                  const SizedBox(height: 14),
                  AppCard(
                    padding: const EdgeInsets.all(14),
                    onTap: () async {
                      final d = await showDatePicker(
                        context: context,
                        initialDate: _endDate.isBefore(DateTime.now()) ? DateTime.now() : _endDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 730)),
                        helpText: 'Date limite de la quête',
                      );
                      if (d != null) setState(() => _endDate = d);
                    },
                    child: Row(children: [
                      const IconChip(LucideIcons.calendarClock, color: AppColors.warning, size: 42),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('Date limite', style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w700, fontSize: 12.5)),
                          Text(Fmt.date(Fmt.dayIso(_endDate), pattern: 'EEEE d MMMM yyyy'),
                              style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
                        ]),
                      ),
                      StatusPill('$_days jour(s)', color: AppColors.warning),
                    ]),
                  ),
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, children: [
                    for (final (label, days) in [('1 semaine', 7), ('2 semaines', 14), ('1 mois', 30), ('3 mois', 90)])
                      ChoiceChip(
                        label: Text(label),
                        selected: _days == days,
                        onSelected: (_) => setState(() => _endDate = DateUtils.dateOnly(DateTime.now()).add(Duration(days: days - 1))),
                      ),
                  ]),
                ],
                if (!_campaign && !_editing) ...[
                  const SizedBox(height: 14),
                  AppCard(
                    padding: const EdgeInsets.fromLTRB(14, 6, 6, 6),
                    child: SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      value: _restricted,
                      activeThumbColor: AppColors.gold,
                      onChanged: (v) => setState(() => _restricted = v),
                      title: Text('Fonds affecté', style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
                      subtitle: Text('Usage réservé : ne finance pas les charges courantes', style: TextStyle(color: p.textMuted, fontSize: 12)),
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Couleur', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: p.textMuted)),
                ),
                const SizedBox(height: 10),
                Row(children: [
                  for (final c in FundStyle.choices)
                    Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: Pressable(
                        onTap: () => setState(() => _color = c),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: c,
                            shape: BoxShape.circle,
                            border: Border.all(color: c == _color ? p.text : Colors.transparent, width: 2.5),
                            boxShadow: c == _color ? [BoxShadow(color: c.withValues(alpha: 0.5), blurRadius: 12)] : null,
                          ),
                          child: c == _color ? const Icon(LucideIcons.check, size: 16, color: Colors.white) : null,
                        ),
                      ),
                    ),
                ]),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.info.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Icon(LucideIcons.info, color: AppColors.info, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _campaign
                            ? 'Les dons de la quête sont affectés à 100 % (aucun prélèvement 80/10/10). À la clôture, le montant collecté reste disponible dans ce compartiment.'
                            : 'Une catégorie de recette dédiée sera créée : les dons qui y sont encaissés sont affectés à 100 % à ce compartiment.',
                        style: TextStyle(color: p.textMuted, fontSize: 12.5, height: 1.45),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 20),
                PrimaryButton(
                  label: _editing ? 'Enregistrer' : (_campaign ? 'Lancer la quête' : 'Créer le compartiment'),
                  icon: _editing ? LucideIcons.check : LucideIcons.rocket,
                  loading: _saving,
                  onPressed: _save,
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _KindCard extends StatelessWidget {
  final bool selected;
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  const _KindCard({required this.selected, required this.icon, required this.title, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Pressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.14) : p.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: selected ? color : p.border, width: selected ? 1.8 : 1),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          IconChip(icon, color: color, size: 40, filled: selected),
          const SizedBox(height: 10),
          Text(title, style: TextStyle(fontWeight: FontWeight.w900, color: p.text)),
          Text(subtitle, style: TextStyle(color: p.textMuted, fontSize: 11.5)),
        ]),
      ),
    );
  }
}

/// Aperçu en direct de la carte telle qu'elle apparaîtra dans la trésorerie
class _Preview extends StatelessWidget {
  final String name;
  final bool campaign;
  final int target;
  final int days;
  final Color color;
  const _Preview({required this.name, required this.campaign, required this.target, required this.days, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Row(children: [
        ProgressRing(
          value: 0,
          size: 62,
          stroke: 7,
          color: color,
          trackColor: Colors.white12,
          center: Icon(campaign ? LucideIcons.target : LucideIcons.piggyBank, color: color, size: 24),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name.trim().isEmpty ? (campaign ? 'Votre quête' : 'Votre compartiment') : name.trim(),
                maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
            const SizedBox(height: 4),
            Text(
              campaign ? '0 FCFA sur ${target > 0 ? Fmt.fcfa(target) : '—'} • $days j' : 'Solde initial : 0 FCFA',
              style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, fontSize: 12.5),
            ),
          ]),
        ),
      ]),
    ).animate(key: ValueKey('$campaign-${color.toARGB32()}')).fadeIn(duration: 250.ms);
  }
}

class _Thousands extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return const TextEditingValue();
    final formatted = Fmt.number(int.parse(digits));
    return TextEditingValue(text: formatted, selection: TextSelection.collapsed(offset: formatted.length));
  }
}
