import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../data/offline_queue.dart';
import '../../../state/data_bus.dart';
import '../../kit/kit.dart';

/// Demande de dépense : soumise à l'autorisation du Leader Principal avant tout paiement.
class ExpenseFormScreen extends StatefulWidget {
  const ExpenseFormScreen({super.key});

  @override
  State<ExpenseFormScreen> createState() => _ExpenseFormScreenState();
}

class _ExpenseFormScreenState extends State<ExpenseFormScreen> {
  final _amount = TextEditingController();
  final _beneficiary = TextEditingController();
  final _purpose = TextEditingController();
  String? _fundId;
  String? _categoryId;
  String _type = 'variable';
  bool _saving = false;

  int get _value => int.tryParse(_amount.text.replaceAll(RegExp(r'\D'), '')) ?? 0;

  @override
  void dispose() {
    _amount.dispose();
    _beneficiary.dispose();
    _purpose.dispose();
    super.dispose();
  }

  Future<(List<Map<String, dynamic>>, List<Map<String, dynamic>>)> _load() async {
    final r = await Future.wait([Api.funds(), Api.expenseCategories()]);
    return (r[0], r[1]);
  }

  Future<void> _save(List<Map<String, dynamic>> funds) async {
    final fund = funds.where((f) => f.s('id') == _fundId).firstOrNull;
    String? error;
    if (_value <= 0) {
      error = 'Saisissez un montant supérieur à 0 FCFA.';
    } else if (_categoryId == null || fund == null) {
      error = 'Choisissez une catégorie et un compartiment.';
    } else if (_beneficiary.text.trim().length < 2) {
      error = 'Le bénéficiaire est obligatoire.';
    } else if (_purpose.text.trim().length < 3) {
      error = 'Expliquez le motif de la dépense.';
    } else if (_value > fund.n('current_balance')) {
      error = 'Montant supérieur au solde du compartiment (${Fmt.fcfa(fund.n('current_balance'))}).';
    }
    if (error != null) return showToast(context, 'Formulaire incomplet', kind: ToastKind.error, detail: error);

    final payload = {
      'categoryId': _categoryId,
      'fundAccountId': _fundId,
      'amount': _value,
      'beneficiary': _beneficiary.text.trim(),
      'purpose': _purpose.text.trim(),
    };
    setState(() => _saving = true);
    try {
      final r = await Api.createExpense(payload);
      if (!mounted) return;
      context.read<DataBus>().bump();
      HapticFeedback.heavyImpact();
      Navigator.pop(context, true);
      showToast(context, 'Demande ${r.s('expense_number')} soumise', detail: 'En attente de l\'autorisation du Leader Principal.');
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.isNetwork) {
        await context.read<OfflineQueue>().add(QueueKind.expense, payload, '${_beneficiary.text.trim()} • ${Fmt.fcfa(_value)}');
        if (!mounted) return;
        Navigator.pop(context, true);
        showToast(context, 'Enregistrée hors connexion', kind: ToastKind.info, detail: 'Elle sera envoyée au retour du réseau.');
      } else {
        showToast(context, 'Demande refusée', kind: ToastKind.error, detail: e.message);
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AuroraBackground(
        child: Loader<(List<Map<String, dynamic>>, List<Map<String, dynamic>>)>(
          load: _load,
          builder: (context, data, _) {
            final (funds, cats) = data;
            _fundId ??= funds.where((f) => f.s('code') == 'GENERAL').firstOrNull?.s('id') ?? (funds.isEmpty ? null : funds.first.s('id'));
            return _form(context, funds, cats);
          },
        ),
      ),
    );
  }

  Widget _form(BuildContext context, List<Map<String, dynamic>> funds, List<Map<String, dynamic>> cats) {
    final p = Palette.of(context);
    final visibleCats = cats.where((c) => c.s('type', 'variable') == _type && c['is_active'] != false).toList();
    final fund = funds.where((f) => f.s('id') == _fundId).firstOrNull;
    final over = fund != null && _value > fund.n('current_balance');

    return ScrollPage(
      showBack: true,
      title: 'Demande de dépense',
      subtitle: 'Circuit : demande → autorisation → paiement',
      children: [
        Gutter(
          child: AppCard(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            borderColor: over ? AppColors.danger : null,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('MONTANT DEMANDÉ', style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w800, letterSpacing: 1.1, fontSize: 11.5)),
              TextField(
                controller: _amount,
                autofocus: true,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                onChanged: (_) => setState(() {}),
                style: TextStyle(color: p.text, fontSize: 38, fontWeight: FontWeight.w900, letterSpacing: -1),
                decoration: InputDecoration(
                  filled: false,
                  hintText: '0',
                  suffixText: 'FCFA',
                  suffixStyle: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w900, fontSize: 18),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  hintStyle: TextStyle(color: p.textFaint, fontSize: 38, fontWeight: FontWeight.w900),
                  contentPadding: const EdgeInsets.symmetric(vertical: 4),
                ),
              ),
              if (_value > 0) Text(Fmt.fcfa(_value), style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w700)),
              if (over)
                const Padding(
                  padding: EdgeInsets.only(top: 6),
                  child: Text('Solde du compartiment insuffisant', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800, fontSize: 12.5)),
                ),
            ]),
          ),
        ),
        const SectionTitle('Compartiment imputé'),
        SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: funds.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final f = funds[i];
              final sel = f.s('id') == _fundId;
              return Pressable(
                onTap: () => setState(() => _fundId = f.s('id')),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  width: 172,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: sel ? AppColors.gold.withValues(alpha: 0.15) : p.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: sel ? AppColors.gold : p.border, width: sel ? 1.6 : 1),
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text(f.s('name'), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w800, color: p.text, fontSize: 12.5)),
                    const SizedBox(height: 4),
                    Text(Fmt.fcfa(f.n('current_balance')), style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w700, fontSize: 12)),
                  ]),
                ),
              );
            },
          ),
        ),
        const SectionTitle('Catégorie'),
        ChoiceChips<String>(
          options: const [('variable', 'Dépenses variables'), ('fixed', 'Charges régulières')],
          selected: _type,
          onChanged: (v) => setState(() {
            _type = v;
            _categoryId = null;
          }),
        ),
        const SizedBox(height: 12),
        Gutter(
          child: Wrap(spacing: 8, runSpacing: 8, children: [
            for (final c in visibleCats)
              Pressable(
                onTap: () => setState(() => _categoryId = c.s('id')),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: c.s('id') == _categoryId ? AppColors.danger.withValues(alpha: 0.14) : p.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: c.s('id') == _categoryId ? AppColors.danger : p.border),
                  ),
                  child: Text(c.s('name'),
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: c.s('id') == _categoryId ? AppColors.danger : p.text)),
                ),
              ),
          ]),
        ),
        const SizedBox(height: 18),
        Gutter(
          child: Column(children: [
            AppField(controller: _beneficiary, label: 'Bénéficiaire', hint: 'Fournisseur, prestataire, personne aidée…', icon: LucideIcons.userRound),
            const SizedBox(height: 14),
            AppField(controller: _purpose, label: 'Motif', hint: 'Pourquoi cette dépense est nécessaire', icon: LucideIcons.messageSquareText, maxLines: 3),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.info.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                const Icon(LucideIcons.shieldCheck, color: AppColors.info, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text('Aucun décaissement sans l\'accord du Leader Principal. Vous serez notifié de sa décision.',
                      style: TextStyle(color: p.textMuted, fontSize: 12.5, height: 1.4)),
                ),
              ]),
            ),
            const SizedBox(height: 20),
            PrimaryButton(label: 'Soumettre la demande', icon: LucideIcons.send, loading: _saving, onPressed: () => _save(funds)),
          ]),
        ),
      ],
    );
  }
}
