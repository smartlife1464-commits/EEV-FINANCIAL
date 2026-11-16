import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../state/notifications.dart';
import '../../../state/session.dart';
import '../../../state/data_bus.dart';
import '../../kit/kit.dart';

/// Fiche détaillée d'une dépense : circuit Demande → Autorisation → Paiement et actions autorisées.
/// Renvoie `true` si la dépense a été modifiée (pour rafraîchir la liste appelante).
Future<bool> showExpenseSheet(BuildContext context, Map<String, dynamic> e) async {
  final r = await showAppSheet<bool>(context, builder: (ctx) => _ExpenseSheet(e: e));
  return r == true;
}

class _ExpenseSheet extends StatefulWidget {
  final Map<String, dynamic> e;
  const _ExpenseSheet({required this.e});

  @override
  State<_ExpenseSheet> createState() => _ExpenseSheetState();
}

class _ExpenseSheetState extends State<_ExpenseSheet> {
  bool _busy = false;
  String _method = 'cash';
  final _ref = TextEditingController();

  @override
  void dispose() {
    _ref.dispose();
    super.dispose();
  }

  Future<void> _act(Future<void> Function() action, String success) async {
    setState(() => _busy = true);
    try {
      await action();
      if (!mounted) return;
      context.read<NotificationsCenter>().refresh();
      context.read<DataBus>().bump();
      Navigator.pop(context, true);
      showToast(context, success);
    } on ApiException catch (err) {
      if (mounted) showToast(context, 'Action impossible', kind: ToastKind.error, detail: err.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.e;
    final p = Palette.of(context);
    final user = context.read<Session>().user!;
    final status = e.s('status');
    final st = StatusStyle.expense(status);
    final requester = e.rel('requested_by');
    final own = (requester['id'] ?? e['requested_by']) == user.id;
    final canDecide = user.permissions.approveExpense && status == 'pending_approval' && !own;
    final canPay = user.permissions.payExpense && status == 'approved';

    final steps = [
      ('Demande', e.s('created'), requester.s('name', 'Service demandeur'), true),
      (
        status == 'rejected' ? 'Rejet' : 'Autorisation du Leader',
        e.s('approved_at'),
        e.rel('approved_by').s('name', status == 'pending_approval' ? 'En attente' : '—'),
        ['approved', 'paid', 'rejected'].contains(status)
      ),
      ('Décaissement', e.s('paid_at'), e.rel('paid_by').s('name', status == 'approved' ? 'Prêt à payer' : '—'), status == 'paid'),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(22, 16, 22, 22),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          StatusPill(st.label, color: st.color, icon: st.icon),
          const Spacer(),
          Text(e.s('expense_number'), style: TextStyle(color: p.textFaint, fontWeight: FontWeight.w800, fontSize: 12)),
        ]),
        const SizedBox(height: 14),
        Text(Fmt.fcfa(e.n('amount')), style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: p.text, letterSpacing: -1)),
        const SizedBox(height: 4),
        Text(e.s('purpose'), style: TextStyle(color: p.textMuted, fontSize: 15, height: 1.4)),
        const SizedBox(height: 18),
        AppCard(
          padding: const EdgeInsets.all(14),
          child: Column(children: [
            _kv(context, LucideIcons.userRound, 'Bénéficiaire', e.s('beneficiary', '—')),
            _kv(context, LucideIcons.tag, 'Catégorie', e.rel('category').s('name', e.s('category_name', '—'))),
            _kv(context, LucideIcons.landmark, 'Compartiment', e.rel('fund_account').s('name', '—')),
            if (e.s('payment_method').isNotEmpty)
              _kv(context, LucideIcons.creditCard, 'Paiement', '${paymentMethods[e.s('payment_method')]?.$1 ?? e.s('payment_method')} ${e.s('payment_reference')}'),
            if (e.s('rejection_reason').isNotEmpty) _kv(context, LucideIcons.messageSquareText, 'Motif', e.s('rejection_reason')),
          ]),
        ),
        const SizedBox(height: 18),
        Text('Circuit de validation', style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
        const SizedBox(height: 10),
        for (final (i, s) in steps.indexed)
          IntrinsicHeight(
            child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Column(children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: s.$4 ? (status == 'rejected' && i == 1 ? AppColors.danger : AppColors.success) : p.surfaceHigh,
                    border: Border.all(color: s.$4 ? Colors.transparent : p.border),
                  ),
                  child: Icon(s.$4 ? (status == 'rejected' && i == 1 ? LucideIcons.x : LucideIcons.check) : LucideIcons.clock,
                      size: 14, color: s.$4 ? Colors.white : p.textFaint),
                ),
                if (i < steps.length - 1) Expanded(child: Container(width: 2, color: p.border)),
              ]),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(s.$1, style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
                    Text('${s.$3}${s.$2.isNotEmpty && s.$4 ? ' • ${Fmt.dateTime(s.$2)}' : ''}',
                        style: TextStyle(color: p.textMuted, fontSize: 12.5)),
                  ]),
                ),
              ),
            ]),
          ),
        if (own && status == 'pending_approval' && user.permissions.approveExpense)
          Container(
            margin: const EdgeInsets.only(top: 4, bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(14)),
            child: const Row(children: [
              Icon(LucideIcons.shieldAlert, color: AppColors.warning, size: 18),
              SizedBox(width: 10),
              Expanded(
                child: Text('Vous êtes l\'auteur de cette demande : l\'auto-approbation est interdite.',
                    style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.w700, fontSize: 12.5)),
              ),
            ]),
          ),
        if (canDecide) ...[
          const SizedBox(height: 8),
          Row(children: [
            Expanded(
              child: SecondaryButton(
                label: 'Rejeter',
                icon: LucideIcons.x,
                color: AppColors.danger,
                onPressed: _busy
                    ? null
                    : () async {
                        final reason = await askReason(context, title: 'Motif du rejet');
                        if (reason == null) return;
                        await _act(() => Api.decideExpense(e.s('id'), 'reject', reason: reason), 'Dépense rejetée');
                      },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: PrimaryButton(
                label: 'Approuver',
                icon: LucideIcons.badgeCheck,
                loading: _busy,
                onPressed: () => _act(() => Api.decideExpense(e.s('id'), 'approve'), 'Dépense approuvée'),
              ),
            ),
          ]),
        ],
        if (canPay) ...[
          const SizedBox(height: 8),
          Text('Mode de décaissement', style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
          const SizedBox(height: 10),
          ChoiceChips<String>(
            padding: EdgeInsets.zero,
            options: [for (final m in paymentMethods.entries) (m.key, m.value.$1)],
            selected: _method,
            onChanged: (v) => setState(() => _method = v),
          ),
          const SizedBox(height: 12),
          AppField(controller: _ref, label: 'Référence (optionnel)', hint: 'N° de transaction, chèque…', icon: LucideIcons.hash),
          const SizedBox(height: 14),
          PrimaryButton(
            label: 'Payer ${Fmt.fcfa(e.n('amount'))}',
            icon: LucideIcons.banknote,
            loading: _busy,
            color: AppColors.success,
            onPressed: () => _act(
              () => Api.payExpense(e.s('id'), _method, reference: _ref.text.trim().isEmpty ? null : _ref.text.trim()),
              'Paiement enregistré au grand livre',
            ),
          ),
        ],
      ]),
    );
  }

  Widget _kv(BuildContext context, IconData icon, String k, String v) {
    final p = Palette.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(children: [
        Icon(icon, size: 16, color: p.textFaint),
        const SizedBox(width: 10),
        Text(k, style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600)),
        const SizedBox(width: 12),
        Expanded(child: Text(v, textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.w800, color: p.text))),
      ]),
    );
  }
}
