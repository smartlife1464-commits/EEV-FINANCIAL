import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../state/notifications.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../attendance/attendance_form_screen.dart';
import '../attendance/attendance_screen.dart';
import '../finance/approvals_screen.dart';
import '../shell/home_shell.dart';

/// Centre d'alertes opérationnelles, groupées par priorité.
class NotificationsScreen extends StatefulWidget {
  final bool standalone;
  const NotificationsScreen({super.key, this.standalone = false});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _filter = 'all';

  void _open(BuildContext context, Map<String, dynamic> n) {
    context.read<NotificationsCenter>().markRead(n.s('id'));
    final perms = context.read<Session>().user!.permissions;
    final link = n.s('link');
    Widget? page;
    if (link == '/finance/approvals' && perms.approveExpense) page = const ApprovalsScreen();
    if (link == '/attendance/new' && perms.submitAttendance) page = const AttendanceFormScreen();
    if (link == '/attendance') page = const AttendanceScreen(standalone: true, initialFilter: 'submitted');
    if (page != null) {
      pushPage(context, page);
    } else {
      showToast(context, n.s('title'), kind: ToastKind.info, detail: n.s('description'));
    }
  }

  @override
  Widget build(BuildContext context) {
    final center = context.watch<NotificationsCenter>();
    final p = Palette.of(context);
    final items = center.items.where((n) => _filter == 'all' || (_filter == 'unread' ? !center.isRead(n.s('id')) : n.s('category') == _filter)).toList();
    final actions = items.where((n) => n.s('severity') != 'info').toList();
    final infos = items.where((n) => n.s('severity') == 'info').toList();

    Widget tile(int i, Map<String, dynamic> n) {
      final read = center.isRead(n.s('id'));
      final sev = n.s('severity');
      final color = sev == 'warning' ? AppColors.danger : (sev == 'action' ? AppColors.gold : AppColors.info);
      final icon = switch (n.s('category')) {
        'finances' => LucideIcons.wallet,
        'protocole' => LucideIcons.clipboardList,
        _ => LucideIcons.bell,
      };
      return Dismissible(
        key: ValueKey(n.s('id')),
        direction: read ? DismissDirection.none : DismissDirection.endToStart,
        confirmDismiss: (_) async {
          center.markRead(n.s('id'));
          return false;
        },
        background: Container(
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 34),
          child: const Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(LucideIcons.checkCheck, color: AppColors.success),
            SizedBox(width: 6),
            Text('Lu', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w800)),
          ]),
        ),
        child: Opacity(
          opacity: read ? 0.62 : 1,
          child: RowTile(
            icon: icon,
            color: color,
            highlighted: !read,
            title: n.s('title'),
            subtitle: '${n.s('description')}\n${n.s('badge')} • ${Fmt.timeAgo(n.s('at'))}',
            trailingWidget: read ? null : Container(width: 9, height: 9, decoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle)),
            onTap: () => _open(context, n),
          ),
        ),
      ).entrance(i);
    }

    final body = ScrollPage(
      showBack: widget.standalone,
      title: 'Alertes',
      subtitle: center.unreadCount > 0 ? '${center.unreadCount} non lue(s)' : 'Tout est à jour',
      onRefresh: center.refresh,
      actions: [
        if (center.unreadCount > 0) RoundIconButton(icon: LucideIcons.checkCheck, tooltip: 'Tout marquer comme lu', onTap: center.markAllRead),
      ],
      children: [
        ChoiceChips<String>(
          options: [
            ('all', 'Toutes'),
            ('unread', 'Non lues'),
            if (!context.read<Session>().user!.role.isProtocol) ('finances', 'Finances'),
            ('protocole', 'Protocole'),
          ],
          selected: _filter,
          onChanged: (v) => setState(() => _filter = v),
        ),
        if (center.error != null && center.items.isEmpty) ErrorState(message: center.error!, onRetry: center.refresh),
        if (center.error == null && items.isEmpty)
          const EmptyState(icon: LucideIcons.bellRing, title: 'Aucune alerte', message: 'Rien ne requiert votre attention pour le moment.'),
        if (actions.isNotEmpty) SectionTitle('À traiter (${actions.length})'),
        for (final (i, n) in actions.indexed) tile(i, n),
        if (infos.isNotEmpty) SectionTitle('Rappels & informations (${infos.length})'),
        for (final (i, n) in infos.indexed) tile(i + actions.length, n),
        if (items.isNotEmpty)
          Padding(
            padding: const EdgeInsets.all(22),
            child: Text('Glissez une alerte vers la gauche pour la marquer comme lue.',
                textAlign: TextAlign.center, style: TextStyle(color: p.textFaint, fontSize: 12)),
          ),
      ],
    );
    return widget.standalone ? Scaffold(body: AuroraBackground(child: body)) : body;
  }
}
