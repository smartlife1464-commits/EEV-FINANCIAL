import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/platform_config.dart';
import '../../../state/platform.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/offline_queue.dart';
import '../../../state/notifications.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../attendance/attendance_form_screen.dart';
import '../attendance/attendance_screen.dart';
import '../dashboard/finance_dashboard.dart';
import '../dashboard/leader_dashboard.dart';
import '../dashboard/protocol_dashboard.dart';
import '../finance/approvals_screen.dart';
import '../finance/entry_form_screen.dart';
import '../finance/expense_form_screen.dart';
import '../finance/finance_screen.dart';
import '../notifications/notifications_screen.dart';
import '../finance/fund_form_screen.dart';
import '../profile/profile_screen.dart';

class _Tab {
  final IconData icon;
  final String label;
  final Widget page;
  const _Tab(this.icon, this.label, this.page);
}

/// Coquille principale : onglets adaptés au rôle, barre de navigation flottante en verre
/// et bouton d'action central (raccourcis de saisie selon les permissions).
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<Session>().user;
      if (user != null) context.read<NotificationsCenter>().start(user.id);
      final queue = context.read<OfflineQueue>();
      if (queue.pendingCount > 0) queue.sync();
    });
  }

  List<_Tab> _tabs(AppUser user) {
    final role = user.role;
    if (role.isProtocol) {
      return const [
        _Tab(LucideIcons.house, 'Accueil', ProtocolDashboard()),
        _Tab(LucideIcons.clipboardList, 'Fiches', AttendanceScreen()),
        _Tab(LucideIcons.bell, 'Alertes', NotificationsScreen()),
        _Tab(LucideIcons.userRound, 'Profil', ProfileScreen()),
      ];
    }
    if (role.isFinanceDesk) {
      return const [
        _Tab(LucideIcons.house, 'Accueil', FinanceDashboardScreen()),
        _Tab(LucideIcons.wallet, 'Finances', FinanceScreen()),
        _Tab(LucideIcons.bell, 'Alertes', NotificationsScreen()),
        _Tab(LucideIcons.userRound, 'Profil', ProfileScreen()),
      ];
    }
    final cfg = PlatformConfig.current;
    return [
      const _Tab(LucideIcons.house, 'Accueil', LeaderDashboard()),
      if (cfg.module('finance')) const _Tab(LucideIcons.wallet, 'Finances', FinanceScreen()),
      if (cfg.module('attendance')) const _Tab(LucideIcons.church, 'Cultes', AttendanceScreen()),
      if (!cfg.module('finance') || !cfg.module('attendance')) const _Tab(LucideIcons.bell, 'Alertes', NotificationsScreen()),
      const _Tab(LucideIcons.userRound, 'Profil', ProfileScreen()),
    ];
  }

  List<_QuickAction> _actions(AppUser user) {
    final p = user.permissions;
    final cfg = PlatformConfig.current;
    final finance = cfg.module('finance');
    return [
      if (p.createEntry && finance)
        _QuickAction(LucideIcons.handCoins, 'Nouvelle recette', 'Dîme, offrande ou don affecté', AppColors.success,
            () => const EntryFormScreen()),
      if (p.createExpense && finance)
        _QuickAction(LucideIcons.receipt, 'Demande de dépense', 'Soumise à l\'accord du Leader', AppColors.danger,
            () => const ExpenseFormScreen()),
      if (p.submitAttendance && cfg.module('attendance'))
        _QuickAction(LucideIcons.clipboardPen, 'Fiche de présence', 'Saisie guidée d\'un culte', AppColors.info,
            () => const AttendanceFormScreen()),
      if (p.approveExpense && finance)
        _QuickAction(LucideIcons.badgeCheck, 'Arbitrer les dépenses', 'Approuver ou rejeter', AppColors.gold,
            () => const ApprovalsScreen()),
      if (user.canManageFunds && cfg.module('campaigns'))
        _QuickAction(LucideIcons.target, 'Lancer une quête', 'Objectif à atteindre avant une date', const Color(0xFFF97316),
            () => const FundFormScreen()),
    ];
  }

  void _openActions(List<_QuickAction> actions) {
    HapticFeedback.mediumImpact();
    showAppSheet<void>(context, builder: (ctx) {
      final p = Palette.of(ctx);
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('Actions rapides', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: p.text)),
          const SizedBox(height: 4),
          Text('Que souhaitez-vous enregistrer ?', style: TextStyle(color: p.textMuted)),
          const SizedBox(height: 16),
          for (final (i, a) in actions.indexed)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: AppCard(
                padding: const EdgeInsets.all(14),
                onTap: () {
                  Navigator.pop(ctx);
                  Navigator.of(context).push(_slideRoute(a.builder()));
                },
                child: Row(children: [
                  IconChip(a.icon, color: a.color, size: 48),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(a.title, style: TextStyle(fontWeight: FontWeight.w800, color: p.text, fontSize: 15.5)),
                      Text(a.subtitle, style: TextStyle(color: p.textMuted, fontSize: 12.5)),
                    ]),
                  ),
                  Icon(LucideIcons.chevronRight, color: p.textFaint),
                ]),
              ).entrance(i),
            ),
        ]),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<Session>().user;
    context.watch<PlatformState>();
    if (user == null) return const SizedBox.shrink();
    final tabs = _tabs(user);
    if (_index >= tabs.length) _index = 0;
    final actions = _actions(user);
    final unread = context.watch<NotificationsCenter>().unreadCount;
    final queue = context.watch<OfflineQueue>();

    return Scaffold(
      extendBody: true,
      body: AuroraBackground(
        child: Stack(children: [
          IndexedStack(
            index: _index,
            children: [
              for (var i = 0; i < tabs.length; i++) _TabFade(active: i == _index, child: tabs[i].page),
            ],
          ),
          // Voile sous la barre d'état : le contenu défilant ne chevauche jamais l'heure / la batterie
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: MediaQuery.of(context).padding.top + 10,
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Palette.of(context).bg, Palette.of(context).bg.withValues(alpha: 0)],
                  ),
                ),
              ),
            ),
          ),
          if (queue.pendingCount > 0 || queue.syncing)
            Positioned(
              top: MediaQuery.of(context).padding.top + 4,
              left: 0,
              right: 0,
              child: Center(child: _SyncBadge(queue: queue)),
            ),
        ]),
      ),
      bottomNavigationBar: _FloatingNavBar(
        tabs: tabs,
        index: _index,
        badges: {for (var i = 0; i < tabs.length; i++) i: tabs[i].label == 'Alertes' ? unread : 0},
        onTap: (i) {
          HapticFeedback.selectionClick();
          setState(() => _index = i);
        },
        onAction: actions.isEmpty ? null : () => _openActions(actions),
      ),
    );
  }
}

Route<T> _slideRoute<T>(Widget page) => PageRouteBuilder<T>(
      transitionDuration: const Duration(milliseconds: 420),
      reverseTransitionDuration: const Duration(milliseconds: 320),
      pageBuilder: (_, _, _) => page,
      transitionsBuilder: (_, anim, _, child) {
        final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(position: Tween(begin: const Offset(0, 0.06), end: Offset.zero).animate(curved), child: child),
        );
      },
    );

/// Navigation vers un écran secondaire avec transition premium (utilisable partout)
Future<T?> pushPage<T>(BuildContext context, Widget page) => Navigator.of(context).push<T>(_slideRoute(page));

class _QuickAction {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final Widget Function() builder;
  const _QuickAction(this.icon, this.title, this.subtitle, this.color, this.builder);
}

class _TabFade extends StatelessWidget {
  final bool active;
  final Widget child;
  const _TabFade({required this.active, required this.child});

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: active ? 1 : 0,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOut,
      child: AnimatedSlide(
        offset: active ? Offset.zero : const Offset(0, 0.015),
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        child: TickerMode(enabled: active, child: child),
      ),
    );
  }
}

class _FloatingNavBar extends StatelessWidget {
  final List<_Tab> tabs;
  final int index;
  final Map<int, int> badges;
  final ValueChanged<int> onTap;
  final VoidCallback? onAction;

  const _FloatingNavBar({required this.tabs, required this.index, required this.badges, required this.onTap, this.onAction});

  @override
  Widget build(BuildContext context) {
    final items = <Widget>[];
    for (var i = 0; i < tabs.length; i++) {
      if (onAction != null && i == tabs.length ~/ 2) items.add(_ActionButton(onTap: onAction!));
      items.add(Expanded(child: _NavItem(tab: tabs[i], active: i == index, badge: badges[i] ?? 0, onTap: () => onTap(i))));
    }
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Glass(
        radius: 30,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(children: items),
      ),
    ).animate().slideY(begin: 1, duration: 600.ms, curve: Curves.easeOutCubic).fadeIn();
  }
}

class _NavItem extends StatelessWidget {
  final _Tab tab;
  final bool active;
  final int badge;
  final VoidCallback onTap;
  const _NavItem({required this.tab, required this.active, required this.badge, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Semantics(
      selected: active,
      button: true,
      label: tab.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
          height: 54,
          margin: const EdgeInsets.symmetric(horizontal: 2),
          decoration: BoxDecoration(
            color: active ? AppColors.gold.withValues(alpha: p.dark ? 0.16 : 0.2) : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Stack(clipBehavior: Clip.none, children: [
              AnimatedScale(
                scale: active ? 1.12 : 1,
                duration: const Duration(milliseconds: 300),
                child: Icon(tab.icon, size: 22, color: active ? p.accent : p.textMuted),
              ),
              if (badge > 0)
                Positioned(
                  right: -8,
                  top: -5,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(color: AppColors.danger, borderRadius: BorderRadius.circular(10)),
                    child: Text(badge > 9 ? '9+' : '$badge',
                        style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w900)),
                  ),
                ),
            ]),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 250),
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: active ? FontWeight.w900 : FontWeight.w600,
                color: active ? p.accent : p.textMuted,
                fontFamily: DefaultTextStyle.of(context).style.fontFamily,
              ),
              child: Text(tab.label),
            ),
          ]),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final VoidCallback onTap;
  const _ActionButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      scale: 0.9,
      child: Container(
        width: 58,
        height: 58,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          gradient: AppColors.goldGradient,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [BoxShadow(color: AppColors.gold.withValues(alpha: 0.5), blurRadius: 18, offset: const Offset(0, 6))],
        ),
        child: const Icon(LucideIcons.plus, color: AppColors.navy, size: 28),
      ),
    ).animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(delay: 3.seconds, duration: 1200.ms, color: Colors.white54);
  }
}

class _SyncBadge extends StatelessWidget {
  final OfflineQueue queue;
  const _SyncBadge({required this.queue});

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: queue.syncing
          ? null
          : () async {
              final r = await queue.sync();
              if (context.mounted) {
                showToast(
                  context,
                  r.synced > 0 ? '${r.synced} saisie(s) synchronisée(s)' : 'Toujours hors connexion',
                  kind: r.synced > 0 ? ToastKind.success : ToastKind.info,
                );
              }
            },
      child: Glass(
        radius: 20,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(queue.syncing ? LucideIcons.refreshCw : LucideIcons.cloudOff, size: 15, color: AppColors.warning),
          const SizedBox(width: 8),
          Text(
            queue.syncing ? 'Synchronisation…' : '${queue.pendingCount} saisie(s) en attente — toucher pour envoyer',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.warning),
          ),
        ]),
      ),
    ).animate().fadeIn().slideY(begin: -0.5);
  }
}
