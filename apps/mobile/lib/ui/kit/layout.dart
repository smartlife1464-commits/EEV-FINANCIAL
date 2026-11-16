import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../state/preferences.dart';
import 'controls.dart';
import 'surfaces.dart';

/// Page à défilement avec en-tête large, actualisation par glisser et espace pour la barre flottante.
class ScrollPage extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Widget> actions;
  final List<Widget> children;
  final Future<void> Function()? onRefresh;
  final Widget? leading;
  final bool showBack;

  const ScrollPage({
    super.key,
    required this.title,
    this.subtitle,
    this.actions = const [],
    required this.children,
    this.onRefresh,
    this.leading,
    this.showBack = false,
  });

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final list = CustomScrollView(
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      slivers: [
        SliverSafeArea(
          bottom: false,
          sliver: SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
              child: Row(children: [
                if (showBack) ...[
                  RoundIconButton(icon: LucideIcons.arrowLeft, onTap: () => Navigator.of(context).maybePop(), tooltip: 'Retour'),
                  const SizedBox(width: 14),
                ],
                ?leading,
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (subtitle != null)
                      Text(subtitle!, style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600, fontSize: 13)),
                    Text(title,
                        style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: p.text, letterSpacing: -0.6, height: 1.15)),
                  ]),
                ),
                for (final a in actions) Padding(padding: const EdgeInsets.only(left: 10), child: a),
              ]),
            ).animate().fadeIn(duration: 350.ms).slideY(begin: -0.15, curve: Curves.easeOutCubic),
          ),
        ),
        SliverList(delegate: SliverChildListDelegate(children)),
        const SliverToBoxAdapter(child: SizedBox(height: 130)),
      ],
    );
    if (onRefresh == null) return list;
    return RefreshIndicator(
      onRefresh: onRefresh!,
      color: AppColors.navy,
      backgroundColor: AppColors.gold,
      edgeOffset: 80,
      child: list,
    );
  }
}

/// Titre de section avec action optionnelle
class SectionTitle extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;
  const SectionTitle(this.title, {super.key, this.action, this.onAction});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 26, 20, 12),
      child: Row(children: [
        Expanded(child: Text(title, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.2))),
        if (action != null)
          Pressable(
            onTap: onAction,
            child: Row(children: [
              Text(action!, style: TextStyle(color: p.accent, fontWeight: FontWeight.w800, fontSize: 13)),
              Icon(LucideIcons.chevronRight, size: 16, color: p.accent),
            ]),
          ),
      ]),
    );
  }
}

/// Barre de période globale (partagée par tous les tableaux de bord)
class PeriodBar extends StatelessWidget {
  const PeriodBar({super.key});

  @override
  Widget build(BuildContext context) {
    final prefs = context.watch<Preferences>();
    return ChoiceChips<String>(
      options: [for (final o in periodOptions) (o.key, o.label)],
      selected: prefs.period,
      onChanged: prefs.setPeriod,
    );
  }
}

/// Animation d'entrée en cascade pour les éléments de liste
extension Entrance on Widget {
  Widget entrance(int index) => animate()
      .fadeIn(duration: 380.ms, delay: (40 * index).clamp(0, 400).ms)
      .slideY(begin: 0.12, curve: Curves.easeOutCubic, duration: 420.ms, delay: (40 * index).clamp(0, 400).ms);
}

/// Marge horizontale standard
class Gutter extends StatelessWidget {
  final Widget child;
  final double vertical;
  const Gutter({super.key, required this.child, this.vertical = 0});

  @override
  Widget build(BuildContext context) =>
      Padding(padding: EdgeInsets.symmetric(horizontal: 20, vertical: vertical), child: child);
}
