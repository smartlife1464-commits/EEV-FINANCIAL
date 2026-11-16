import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import 'controls.dart';
import 'surfaces.dart';

/// Carte « héros » bleu nuit avec halo doré : chiffre clé du tableau de bord.
class HeroCard extends StatelessWidget {
  final String eyebrow;
  final num value;
  final String Function(num) format;
  final Widget? footer;
  final Widget? trailing;
  final Widget? chart;
  final IconData icon;

  const HeroCard({
    super.key,
    required this.eyebrow,
    required this.value,
    required this.format,
    this.footer,
    this.trailing,
    this.chart,
    this.icon = LucideIcons.wallet,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.28)),
        boxShadow: [
          BoxShadow(color: AppColors.navy.withValues(alpha: 0.45), blurRadius: 40, offset: const Offset(0, 18)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32),
        child: Stack(children: [
          Positioned(
            right: -60,
            top: -80,
            child: Container(
              width: 240,
              height: 240,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [AppColors.gold.withValues(alpha: 0.35), AppColors.gold.withValues(alpha: 0)]),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                IconChip(icon, color: AppColors.gold, size: 40, filled: true),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(eyebrow.toUpperCase(),
                      style: const TextStyle(color: Colors.white70, fontSize: 11.5, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
                ),
                ?trailing,
              ]),
              const SizedBox(height: 18),
              AnimatedNumber(
                value,
                format: format,
                style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w900, letterSpacing: -1),
              ),
              if (footer != null) ...[const SizedBox(height: 8), footer!],
              if (chart != null) ...[const SizedBox(height: 12), chart!],
            ]),
          ),
        ]),
      ),
    ).animate().fadeIn(duration: 500.ms).scaleXY(begin: 0.96, curve: Curves.easeOutCubic);
  }
}

/// Tuile KPI compacte (grille 2 colonnes)
class KpiTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final num value;
  final String Function(num) format;
  final Widget? badge;
  final String? caption;
  final VoidCallback? onTap;

  const KpiTile({
    super.key,
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
    required this.format,
    this.badge,
    this.caption,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [IconChip(icon, color: color, size: 38), const Spacer(), ?badge]),
        const SizedBox(height: 14),
        AnimatedNumber(value, format: format, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: p.text, letterSpacing: -0.5)),
        const SizedBox(height: 2),
        Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w700, color: p.textMuted, fontSize: 12.5)),
        if (caption != null) ...[
          const SizedBox(height: 4),
          Text(caption!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: p.textFaint, fontSize: 11.5, fontWeight: FontWeight.w600)),
        ],
      ]),
    );
  }
}

/// Grille de deux colonnes à hauteur égale
class TwoColumns extends StatelessWidget {
  final List<Widget> children;
  const TwoColumns({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i += 2) {
      rows.add(IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(child: children[i]),
          const SizedBox(width: 12),
          Expanded(child: i + 1 < children.length ? children[i + 1] : const SizedBox()),
        ]),
      ));
      if (i + 2 < children.length) rows.add(const SizedBox(height: 12));
    }
    return Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: Column(children: rows));
  }
}

/// Ligne de liste riche (transactions, fiches, alertes)
class RowTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String? subtitle;
  final String? trailing;
  final Color? trailingColor;
  final Widget? trailingWidget;
  final VoidCallback? onTap;
  final bool highlighted;

  const RowTile({
    super.key,
    required this.icon,
    required this.color,
    required this.title,
    this.subtitle,
    this.trailing,
    this.trailingColor,
    this.trailingWidget,
    this.onTap,
    this.highlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        radius: 22,
        borderColor: highlighted ? AppColors.gold.withValues(alpha: 0.45) : null,
        child: Row(children: [
          IconChip(icon, color: color, size: 44),
          const SizedBox(width: 13),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w800, color: p.text, fontSize: 14.5)),
              if (subtitle != null) ...[
                const SizedBox(height: 3),
                Text(subtitle!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: p.textMuted, fontSize: 12.5, height: 1.35)),
              ],
            ]),
          ),
          if (trailing != null || trailingWidget != null) const SizedBox(width: 10),
          if (trailing != null)
            Text(trailing!, style: TextStyle(fontWeight: FontWeight.w900, color: trailingColor ?? p.text, fontSize: 14)),
          ?trailingWidget,
        ]),
      ),
    );
  }
}

/// Ligne de légende (graphiques)
class LegendRow extends StatelessWidget {
  final Color color;
  final String label;
  final String value;
  const LegendRow({super.key, required this.color, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
        const SizedBox(width: 10),
        Expanded(child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600, fontSize: 13))),
        Text(value, style: TextStyle(color: p.text, fontWeight: FontWeight.w800, fontSize: 13)),
      ]),
    );
  }
}
