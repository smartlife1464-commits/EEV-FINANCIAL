import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../state/notifications.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../notifications/notifications_screen.dart';
import '../finance/fund_detail_screen.dart';
import '../finance/fund_style.dart';
import '../shell/home_shell.dart';

/// En-tête personnalisé des tableaux de bord : salutation, rôle, accès aux alertes.
class DashboardHeader extends StatelessWidget {
  const DashboardHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<Session>().user!;
    final unread = context.watch<NotificationsCenter>().unreadCount;
    final p = Palette.of(context);
    // L'or pur manque de contraste sur fond clair : teinte plus profonde en mode clair
    final roleColor = !p.dark && user.role.color == AppColors.gold ? AppColors.goldDeep : user.role.color;
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
        child: Row(children: [
          Avatar(initials: user.initials, color: user.role.color, size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${Fmt.greeting()} 👋', style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600, fontSize: 13)),
              Text(user.firstName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: p.text, letterSpacing: -0.4)),
              const SizedBox(height: 2),
              Row(children: [
                Icon(user.role.icon, size: 13, color: roleColor),
                const SizedBox(width: 5),
                Text(user.role.label, style: TextStyle(color: roleColor, fontWeight: FontWeight.w800, fontSize: 12)),
              ]),
            ]),
          ),
          RoundIconButton(
            icon: LucideIcons.bell,
            badge: unread,
            tooltip: 'Notifications',
            onTap: () => pushPage(context, const NotificationsScreen(standalone: true)),
          ),
        ]),
      ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.2, curve: Curves.easeOutCubic),
    );
  }
}

/// Bandeau d'action prioritaire (dépenses à arbitrer, fiches à valider…)
class ActionBanner extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  const ActionBanner({super.key, required this.icon, required this.title, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Gutter(
      vertical: 6,
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        borderColor: color.withValues(alpha: 0.45),
        gradient: LinearGradient(colors: [color.withValues(alpha: p.dark ? 0.18 : 0.12), p.surface]),
        child: Row(children: [
          IconChip(icon, color: color, size: 46, filled: true),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: TextStyle(fontWeight: FontWeight.w900, color: p.text)),
              const SizedBox(height: 2),
              Text(subtitle, style: TextStyle(color: p.textMuted, fontSize: 12.5)),
            ]),
          ),
          Icon(LucideIcons.chevronRight, color: color),
        ]),
      ),
    ).animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(delay: 2.seconds, duration: 1500.ms, color: color.withValues(alpha: 0.15));
  }
}

/// Carrousel horizontal des compartiments de la caisse
class FundsCarousel extends StatelessWidget {
  final List<Map<String, dynamic>> funds;
  const FundsCarousel({super.key, required this.funds});

  static IconData iconFor(String code) => FundStyle.of(code: code).icon;

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    if (funds.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 158,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        physics: const BouncingScrollPhysics(),
        itemCount: funds.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, i) {
          final f = funds[i];
          final account = f.obj('account');
          final style = FundStyle.ofTreasury(f);
          final color = style.color;
          final campaign = f['campaign'] is Map ? f.obj('campaign') : null;
          return SizedBox(
            width: 200,
            child: AppCard(
              onTap: account.s('id').isEmpty ? null : () => pushPage(context, FundDetailScreen(fundId: account.s('id'))),
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  IconChip(style.icon, color: color, size: 36),
                  const Spacer(),
                  if (campaign != null)
                    Text(Fmt.percent(campaign.n('percentage')), style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 12))
                  else if (account.b('isRestricted'))
                    Icon(LucideIcons.lock, size: 14, color: p.textFaint),
                ]),
                const Spacer(),
                Text(account.s('name'), maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w700, fontSize: 12)),
                const SizedBox(height: 2),
                Text(Fmt.fcfa(f.n('balance')), maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: p.text, fontWeight: FontWeight.w900, fontSize: 16)),
                const SizedBox(height: 10),
                ProgressBar(value: campaign != null ? campaign.n('percentage') / 100 : f.n('percentageOfTotal') / 100, color: color, height: 6),
              ]),
            ),
          ).entrance(i);
        },
      ),
    );
  }
}

/// Fil d'activité récente
class ActivityFeed extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  const ActivityFeed({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const EmptyState(icon: LucideIcons.history, title: 'Aucune activité', message: 'Les dernières opérations apparaîtront ici.');
    }
    return Column(children: [
      for (final (i, a) in items.indexed)
        RowTile(
          icon: switch (a.s('type')) {
            'entry' => LucideIcons.arrowDownLeft,
            'expense' => LucideIcons.arrowUpRight,
            _ => LucideIcons.clipboardCheck,
          },
          color: switch (a.s('type')) {
            'entry' => AppColors.success,
            'expense' => AppColors.danger,
            _ => AppColors.info,
          },
          title: a.s('title'),
          subtitle: '${a.s('status')} • ${Fmt.timeAgo(a.s('at'))}',
          trailing: a['amount'] == null ? null : Fmt.fcfaCompact(a.n('amount')),
          trailingColor: a.s('type') == 'entry' ? AppColors.success : null,
        ).entrance(i),
    ]);
  }
}
