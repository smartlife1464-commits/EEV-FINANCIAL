import 'package:provider/provider.dart';
import '../../state/platform.dart';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';

/// Fond « aurore » : dégradé profond avec halos or et indigo animés lentement.
class AuroraBackground extends StatefulWidget {
  final Widget child;
  final bool intense;
  const AuroraBackground({super.key, required this.child, this.intense = false});

  @override
  State<AuroraBackground> createState() => _AuroraBackgroundState();
}

class _AuroraBackgroundState extends State<AuroraBackground> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(seconds: 18))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final dark = p.dark || widget.intense;
    return Stack(
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: dark
                  ? const LinearGradient(
                      colors: [Color(0xFF071030), AppColors.darkBg, Color(0xFF030716)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    )
                  : const LinearGradient(
                      colors: [Color(0xFFFFFBEF), AppColors.lightBg, Color(0xFFEEF2FA)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
            ),
          ),
        ),
        Positioned.fill(
          child: AnimatedBuilder(
            animation: _c,
            builder: (context, _) {
              final t = _c.value * 2 * math.pi;
              return Stack(children: [
                _orb(Alignment(-0.9 + 0.25 * math.sin(t), -1.0 + 0.15 * math.cos(t)), 320,
                    AppColors.gold.withValues(alpha: dark ? 0.16 : 0.22)),
                _orb(Alignment(1.1 + 0.2 * math.cos(t), -0.35 + 0.2 * math.sin(t)), 280,
                    AppColors.indigo.withValues(alpha: dark ? 0.35 : 0.12)),
                _orb(Alignment(-0.6 + 0.3 * math.cos(t * 0.7), 1.1), 300,
                    AppColors.violet.withValues(alpha: dark ? 0.12 : 0.07)),
              ]);
            },
          ),
        ),
        widget.child,
      ],
    );
  }

  Widget _orb(Alignment a, double size, Color color) => Align(
        alignment: a,
        child: IgnorePointer(
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: [color, color.withValues(alpha: 0)]),
            ),
          ),
        ),
      );
}

/// Carte standard : coins 24, bordure fine, ombre douce.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Gradient? gradient;
  final Color? color;
  final double radius;
  final Color? borderColor;

  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.onTap,
    this.gradient,
    this.color,
    this.radius = 24,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? (color ?? p.surface) : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: borderColor ?? p.border.withValues(alpha: p.dark ? 0.8 : 1)),
        boxShadow: [BoxShadow(color: p.shadow, blurRadius: 24, offset: const Offset(0, 10))],
      ),
      child: child,
    );
    if (onTap == null) return card;
    return Pressable(onTap: onTap, child: card);
  }
}

/// Verre dépoli (navigation flottante, en-têtes).
class Glass extends StatelessWidget {
  final Widget child;
  final double radius;
  final EdgeInsetsGeometry padding;
  final double blur;
  const Glass({super.key, required this.child, this.radius = 28, this.padding = EdgeInsets.zero, this.blur = 22});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: p.dark ? const Color(0xFF0B1534).withValues(alpha: 0.72) : Colors.white.withValues(alpha: 0.78),
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: p.dark ? Colors.white.withValues(alpha: 0.08) : Colors.white),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Effet de pression : léger rétrécissement + retour haptique.
class Pressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double scale;
  const Pressable({super.key, required this.child, this.onTap, this.onLongPress, this.scale = 0.97});

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (widget.onTap == null) return;
    setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _set(true),
      onTapCancel: () => _set(false),
      onTapUp: (_) => _set(false),
      onTap: widget.onTap == null
          ? null
          : () {
              HapticFeedback.selectionClick();
              widget.onTap!();
            },
      onLongPress: widget.onLongPress,
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// Pastille d'icône colorée (chip carré arrondi)
class IconChip extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;
  final bool filled;
  const IconChip(this.icon, {super.key, required this.color, this.size = 44, this.filled = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: filled ? color : color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(size * 0.32),
        border: filled ? null : Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: Icon(icon, size: size * 0.48, color: filled ? AppColors.navy : color),
    );
  }
}

/// Logo officiel dans un écrin arrondi, avec halo optionnel.
class BrandLogo extends StatelessWidget {
  final double size;
  final bool glow;
  const BrandLogo({super.key, this.size = 56, this.glow = false});

  /// Logo configuré par l'église (console plateforme), sinon icône de l'application
  Widget _logo(BuildContext context) {
    final cfg = context.watch<PlatformState>().config;
    final bytes = cfg.logoBytes;
    const fallback = Image(image: AssetImage('assets/images/logo.png'), fit: BoxFit.cover);
    if (bytes != null) return ColoredBox(color: Colors.white, child: Image.memory(bytes, fit: BoxFit.contain, errorBuilder: (_, _, _) => fallback));
    if (cfg.logo.startsWith('https://')) {
      return ColoredBox(color: Colors.white, child: Image.network(cfg.logo, fit: BoxFit.contain, errorBuilder: (_, _, _) => fallback));
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        boxShadow: glow
            ? [BoxShadow(color: AppColors.gold.withValues(alpha: 0.45), blurRadius: size * 0.6, spreadRadius: size * 0.02)]
            : [BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 14, offset: const Offset(0, 6))],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(size * 0.28),
        child: _logo(context),
      ),
    );
  }
}

/// Avatar aux initiales avec anneau dégradé.
class Avatar extends StatelessWidget {
  final String initials;
  final double size;
  final Color color;
  const Avatar({super.key, required this.initials, this.size = 44, this.color = AppColors.gold});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: SweepGradient(colors: [color, color.withValues(alpha: 0.3), color]),
      ),
      child: Container(
        decoration: BoxDecoration(shape: BoxShape.circle, color: Palette.of(context).surface),
        alignment: Alignment.center,
        child: Text(
          initials,
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: size * 0.34, color: color),
        ),
      ),
    );
  }
}
