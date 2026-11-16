import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../data/offline_queue.dart';
import '../../../state/notifications.dart';
import '../../../state/preferences.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import 'server_sheet.dart';

/// Profil & réglages : identité, thème, file hors-ligne, serveur, déconnexion.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<Session>().user!;
    final prefs = context.watch<Preferences>();
    final queue = context.watch<OfflineQueue>();
    final p = Palette.of(context);

    return ScrollPage(
      title: 'Profil',
      subtitle: 'Compte & préférences',
      children: [
        Gutter(
          child: AppCard(
            gradient: AppColors.heroGradient,
            padding: const EdgeInsets.all(20),
            child: Row(children: [
              Avatar(initials: user.initials, color: user.role.color, size: 66),
              const SizedBox(width: 16),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(user.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                  const SizedBox(height: 2),
                  Text(user.email, style: const TextStyle(color: Colors.white60, fontSize: 12.5)),
                  const SizedBox(height: 10),
                  StatusPill(user.role.label, color: user.role.color, icon: user.role.icon),
                ]),
              ),
            ]),
          ),
        ),
        const SectionTitle('Mes habilitations'),
        Gutter(
          child: Wrap(spacing: 8, runSpacing: 8, children: [
            for (final (allowed, label) in [
              (user.permissions.createEntry, 'Encaisser'),
              (user.permissions.createExpense, 'Demander une dépense'),
              (user.permissions.approveExpense, 'Approuver'),
              (user.permissions.payExpense, 'Décaisser'),
              (user.permissions.submitAttendance, 'Saisir les fiches'),
              (user.permissions.validateAttendance, 'Valider les fiches'),
            ])
              if (allowed) StatusPill(label, color: AppColors.success, icon: LucideIcons.check),
          ]),
        ),
        const SectionTitle('Apparence'),
        Gutter(
          child: AppCard(
            padding: const EdgeInsets.all(6),
            child: Row(children: [
              for (final (mode, label, icon) in [
                (ThemeMode.light, 'Clair', LucideIcons.sun),
                (ThemeMode.dark, 'Sombre', LucideIcons.moon),
                (ThemeMode.system, 'Auto', LucideIcons.smartphone),
              ])
                Expanded(
                  child: Pressable(
                    onTap: () => prefs.setThemeMode(mode),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        gradient: prefs.themeMode == mode ? AppColors.goldGradient : null,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Column(children: [
                        Icon(icon, size: 20, color: prefs.themeMode == mode ? AppColors.navy : p.textMuted),
                        const SizedBox(height: 4),
                        Text(label,
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5, color: prefs.themeMode == mode ? AppColors.navy : p.textMuted)),
                      ]),
                    ),
                  ),
                ),
            ]),
          ),
        ),
        const SectionTitle('Saisies hors connexion'),
        if (queue.items.isEmpty)
          Gutter(
            child: AppCard(
              child: Row(children: [
                const IconChip(LucideIcons.cloudUpload, color: AppColors.success),
                const SizedBox(width: 12),
                Expanded(child: Text('Tout est synchronisé avec le serveur.', style: TextStyle(fontWeight: FontWeight.w700, color: p.text))),
              ]),
            ),
          )
        else ...[
          for (final item in queue.items)
            RowTile(
              icon: switch (item.kind) {
                QueueKind.entry => LucideIcons.handCoins,
                QueueKind.expense => LucideIcons.receipt,
                QueueKind.sheet => LucideIcons.clipboardList,
              },
              color: item.error == null ? AppColors.warning : AppColors.danger,
              title: item.label,
              subtitle: item.error == null ? 'En attente • ${Fmt.timeAgo(item.queuedAt)}' : 'Refusée : ${item.error}',
              trailingWidget: IconButton(
                tooltip: 'Supprimer',
                icon: Icon(LucideIcons.trash2, size: 18, color: p.textMuted),
                onPressed: () async {
                  if (await confirmAction(context, title: 'Supprimer cette saisie ?', message: 'Elle ne sera pas envoyée au serveur.', icon: LucideIcons.trash2)) {
                    queue.remove(item.id);
                  }
                },
              ),
            ),
          Gutter(
            vertical: 8,
            child: PrimaryButton(
              label: queue.syncing ? 'Synchronisation…' : 'Synchroniser maintenant',
              icon: LucideIcons.refreshCw,
              loading: queue.syncing,
              onPressed: () async {
                final r = await queue.sync();
                if (context.mounted) {
                  showToast(context, '${r.synced} saisie(s) envoyée(s)',
                      kind: r.failed > 0 ? ToastKind.error : ToastKind.success,
                      detail: r.failed > 0 ? '${r.failed} refusée(s) : consultez le motif.' : (r.pending > 0 ? '${r.pending} toujours en attente de réseau.' : null));
                }
              },
            ),
          ),
        ],
        const SectionTitle('Application'),
        _SettingRow(icon: LucideIcons.serverCog, label: 'Serveur de l\'application', onTap: () => showServerSheet(context)),
        _SettingRow(
          icon: LucideIcons.building2,
          label: 'Ministère',
          trailing: FutureBuilder<Map<String, dynamic>>(
            future: Api.settings(),
            builder: (context, s) => Text(s.data?.s('name') ?? '…', style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600)),
          ),
        ),
        _SettingRow(icon: LucideIcons.info, label: 'Version', trailing: Text('2.0.0', style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600))),
        Gutter(
          vertical: 18,
          child: SecondaryButton(
            label: 'Se déconnecter',
            icon: LucideIcons.logOut,
            color: AppColors.danger,
            onPressed: () async {
              final ok = await confirmAction(context, title: 'Se déconnecter ?', message: 'Vous devrez saisir à nouveau vos identifiants.', confirmLabel: 'Déconnexion', icon: LucideIcons.logOut);
              if (ok && context.mounted) {
                context.read<NotificationsCenter>().stop();
                await context.read<Session>().signOut();
              }
            },
          ),
        ),
        Center(
          child: Text('Ministère Esprit & Vie • Plateforme de gestion', style: TextStyle(color: p.textFaint, fontSize: 11.5)),
        ),
      ],
    );
  }
}

class _SettingRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget? trailing;
  final VoidCallback? onTap;
  const _SettingRow({required this.icon, required this.label, this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          IconChip(icon, color: AppColors.gold, size: 40),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: TextStyle(fontWeight: FontWeight.w700, color: p.text))),
          trailing ?? Icon(LucideIcons.chevronRight, size: 18, color: p.textFaint),
        ]),
      ),
    );
  }
}
