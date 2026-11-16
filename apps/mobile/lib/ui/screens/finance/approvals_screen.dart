import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../state/notifications.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../../../state/data_bus.dart';
import 'expense_actions.dart';

/// Centre d'autorisation du Leader Principal : arbitrage en un geste (glisser ou boutons).
class ApprovalsScreen extends StatefulWidget {
  const ApprovalsScreen({super.key});

  @override
  State<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends State<ApprovalsScreen> {
  int _reload = 0;
  final Set<String> _done = {};

  Future<void> _decide(Map<String, dynamic> e, String decision) async {
    String? reason;
    if (decision == 'reject') {
      reason = await askReason(context, title: 'Rejeter ${e.s('expense_number')}');
      if (reason == null) return;
    }
    try {
      await Api.decideExpense(e.s('id'), decision, reason: reason);
      HapticFeedback.mediumImpact();
      setState(() => _done.add(e.s('id')));
      if (!mounted) return;
      context.read<NotificationsCenter>().refresh();
      context.read<DataBus>().bump();
      showToast(context, decision == 'approve' ? 'Dépense approuvée' : 'Dépense rejetée',
          detail: decision == 'approve' ? 'Transmise à la caisse pour paiement.' : 'Le motif est archivé dans la piste d\'audit.');
    } on ApiException catch (err) {
      if (mounted) showToast(context, 'Action impossible', kind: ToastKind.error, detail: err.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<Session>().user!;
    return Scaffold(
      body: AuroraBackground(
        child: Loader<List<Map<String, dynamic>>>(
          reloadKey: _reload,
          load: Api.expenses,
          builder: (context, all, reload) {
            final p = Palette.of(context);
            final pending = all.where((e) => e.s('status') == 'pending_approval' && !_done.contains(e.s('id'))).toList();
            final total = pending.fold<num>(0, (s, e) => s + e.n('amount'));
            return ScrollPage(
              showBack: true,
              title: 'Approbations',
              subtitle: '${pending.length} demande(s) • ${Fmt.fcfa(total)}',
              onRefresh: () async {
                _done.clear();
                await reload();
              },
              children: [
                if (pending.isEmpty)
                  const EmptyState(
                    icon: LucideIcons.badgeCheck,
                    title: 'Tout est arbitré',
                    message: 'Aucune dépense n\'attend votre décision. Merci pour votre vigilance.',
                  ),
                if (pending.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 0, 22, 10),
                    child: Text('Glissez vers la droite pour approuver, vers la gauche pour rejeter.',
                        style: TextStyle(color: p.textFaint, fontSize: 12.5, fontWeight: FontWeight.w600)),
                  ),
                for (final (i, e) in pending.indexed)
                  _ApprovalCard(
                    key: ValueKey(e.s('id')),
                    e: e,
                    own: e.rel('requested_by')['id'] == user.id,
                    onDecide: (d) => _decide(e, d),
                    onOpen: () async {
                      if (await showExpenseSheet(context, e)) setState(() => _reload++);
                    },
                  ).entrance(i),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ApprovalCard extends StatelessWidget {
  final Map<String, dynamic> e;
  final bool own;
  final ValueChanged<String> onDecide;
  final VoidCallback onOpen;
  const _ApprovalCard({super.key, required this.e, required this.own, required this.onDecide, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final card = AppCard(
      onTap: onOpen,
      padding: const EdgeInsets.all(18),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          IconChip(LucideIcons.receipt, color: AppColors.warning, size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(e.s('beneficiary'), style: TextStyle(fontWeight: FontWeight.w900, color: p.text, fontSize: 15.5)),
              Text('${e.s('expense_number')} • ${Fmt.timeAgo(e.s('created'))}', style: TextStyle(color: p.textFaint, fontSize: 12)),
            ]),
          ),
          Text(Fmt.fcfaCompact(e.n('amount')), style: TextStyle(fontWeight: FontWeight.w900, color: p.text, fontSize: 18)),
        ]),
        const SizedBox(height: 12),
        Text(e.s('purpose'), style: TextStyle(color: p.textMuted, height: 1.4)),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8, children: [
          StatusPill(e.rel('category').s('name', e.s('category_name', 'Dépense')), color: AppColors.info, icon: LucideIcons.tag),
          StatusPill(e.rel('fund_account').s('name', 'Fonds'), color: AppColors.violet, icon: LucideIcons.landmark),
          if (e.rel('requested_by').s('name').isNotEmpty)
            StatusPill(e.rel('requested_by').s('name'), color: AppColors.gold, icon: LucideIcons.userRound),
        ]),
        const SizedBox(height: 14),
        if (own)
          const Text('Vous êtes l\'auteur de cette demande : l\'auto-approbation est interdite.',
              style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.w700, fontSize: 12.5))
        else
          Row(children: [
            Expanded(child: SecondaryButton(label: 'Rejeter', icon: LucideIcons.x, color: AppColors.danger, onPressed: () => onDecide('reject'))),
            const SizedBox(width: 10),
            Expanded(child: PrimaryButton(label: 'Approuver', icon: LucideIcons.check, onPressed: () => onDecide('approve'))),
          ]),
      ]),
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: own
          ? card
          : Dismissible(
              key: ValueKey('swipe-${e.s('id')}'),
              confirmDismiss: (dir) async {
                onDecide(dir == DismissDirection.startToEnd ? 'approve' : 'reject');
                return false;
              },
              background: _swipeBg(LucideIcons.check, 'Approuver', AppColors.success, Alignment.centerLeft),
              secondaryBackground: _swipeBg(LucideIcons.x, 'Rejeter', AppColors.danger, Alignment.centerRight),
              child: card,
            ),
    );
  }

  Widget _swipeBg(IconData icon, String label, Color color, Alignment align) => Container(
        alignment: align,
        padding: const EdgeInsets.symmetric(horizontal: 26),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(24)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, color: color),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w900)),
        ]),
      );
}
