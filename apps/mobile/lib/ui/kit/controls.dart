import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/format.dart';
import '../../core/theme/app_colors.dart';
import 'surfaces.dart';

/// Bouton principal doré (dégradé, chargement, retour haptique).
class PrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool loading;
  final bool expand;
  final Color? color;

  const PrimaryButton({super.key, required this.label, this.icon, this.onPressed, this.loading = false, this.expand = true, this.color});

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;
    final fg = color == null ? AppColors.navy : Colors.white;
    return Pressable(
      onTap: enabled ? onPressed : null,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: enabled || loading ? 1 : 0.5,
        child: Container(
          height: 58,
          width: expand ? double.infinity : null,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          decoration: BoxDecoration(
            gradient: color == null ? AppColors.goldGradient : null,
            color: color,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: (color ?? AppColors.gold).withValues(alpha: 0.35), blurRadius: 22, offset: const Offset(0, 10)),
            ],
          ),
          child: Row(
            mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (loading)
                SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.6, color: fg))
              else ...[
                if (icon != null) ...[Icon(icon, color: fg, size: 20), const SizedBox(width: 10)],
                Flexible(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: fg, fontWeight: FontWeight.w800, fontSize: 16, letterSpacing: 0.2),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Bouton secondaire (contour)
class SecondaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final Color? color;
  const SecondaryButton({super.key, required this.label, this.icon, this.onPressed, this.color});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final c = color ?? p.text;
    return Pressable(
      onTap: onPressed,
      child: Container(
        height: 54,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        decoration: BoxDecoration(
          color: (color ?? p.surfaceHigh).withValues(alpha: color == null ? 1 : 0.1),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color?.withValues(alpha: 0.35) ?? p.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[Icon(icon, size: 19, color: c), const SizedBox(width: 8)],
            Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: TextStyle(color: c, fontWeight: FontWeight.w700))),
          ],
        ),
      ),
    );
  }
}

/// Bouton rond icône (en-têtes), avec badge optionnel.
class RoundIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final int badge;
  final String? tooltip;
  const RoundIconButton({super.key, required this.icon, this.onTap, this.badge = 0, this.tooltip});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final btn = Pressable(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: p.surface.withValues(alpha: p.dark ? 0.7 : 1),
              shape: BoxShape.circle,
              border: Border.all(color: p.border),
            ),
            child: Icon(icon, size: 20, color: p.text),
          ),
          if (badge > 0)
            Positioned(
              right: -2,
              top: -2,
              child: Container(
                constraints: const BoxConstraints(minWidth: 20),
                height: 20,
                padding: const EdgeInsets.symmetric(horizontal: 5),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.gold,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: p.bg, width: 2),
                ),
                child: Text(badge > 99 ? '99+' : '$badge',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.navy)),
              ),
            ),
        ],
      ),
    );
    return Semantics(button: true, label: tooltip, child: btn);
  }
}

/// Champ de saisie premium avec icône
class AppField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final IconData? icon;
  final bool obscure;
  final Widget? suffix;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final int maxLines;
  final List<TextInputFormatter>? inputFormatters;
  final Iterable<String>? autofillHints;

  const AppField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.icon,
    this.obscure = false,
    this.suffix,
    this.keyboardType,
    this.validator,
    this.textInputAction,
    this.onSubmitted,
    this.maxLines = 1,
    this.inputFormatters,
    this.autofillHints,
  });

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: p.textMuted)),
        ),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          validator: validator,
          textInputAction: textInputAction,
          onFieldSubmitted: onSubmitted,
          maxLines: maxLines,
          inputFormatters: inputFormatters,
          autofillHints: autofillHints,
          style: TextStyle(fontWeight: FontWeight.w600, color: p.text),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: icon == null ? null : Icon(icon, size: 20, color: p.textMuted),
            suffixIcon: suffix,
          ),
        ),
      ],
    );
  }
}

/// Pastille de statut
class StatusPill extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;
  const StatusPill(this.label, {super.key, required this.color, this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 12, color: color), const SizedBox(width: 5)],
        Text(label, style: TextStyle(color: color, fontSize: 11.5, fontWeight: FontWeight.w800)),
      ]),
    );
  }
}

/// Variation en pourcentage (vert si favorable, rouge sinon)
class DeltaPill extends StatelessWidget {
  final num percentage;
  final bool favorableWhenUp;
  final bool onDark;
  const DeltaPill(this.percentage, {super.key, this.favorableWhenUp = true, this.onDark = false});

  @override
  Widget build(BuildContext context) {
    final up = percentage > 0;
    final neutral = percentage == 0;
    final good = neutral || (up == favorableWhenUp);
    final color = neutral ? (onDark ? Colors.white70 : Palette.of(context).textMuted) : (good ? AppColors.success : AppColors.danger);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(20)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(neutral ? LucideIcons.minus : (up ? LucideIcons.trendingUp : LucideIcons.trendingDown), size: 13, color: color),
        const SizedBox(width: 4),
        Text(Fmt.percent(percentage, signed: true), style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 11.5)),
      ]),
    );
  }
}

/// Sélecteur à puces horizontales (périodes, filtres, catégories)
class ChoiceChips<T> extends StatelessWidget {
  final List<(T, String)> options;
  final T selected;
  final ValueChanged<T> onChanged;
  final EdgeInsetsGeometry padding;
  const ChoiceChips({super.key, required this.options, required this.selected, required this.onChanged, this.padding = const EdgeInsets.symmetric(horizontal: 20)});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return SizedBox(
      height: 42,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: padding,
        itemCount: options.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final (value, label) = options[i];
          final active = value == selected;
          return Pressable(
            onTap: () => onChanged(value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: active ? AppColors.goldGradient : null,
                color: active ? null : p.surface.withValues(alpha: p.dark ? 0.7 : 1),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: active ? Colors.transparent : p.border),
              ),
              child: Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  color: active ? AppColors.navy : p.textMuted,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Compteur animé (montants et effectifs qui « défilent » à l'affichage)
class AnimatedNumber extends StatelessWidget {
  final num value;
  final String Function(num) format;
  final TextStyle? style;
  const AnimatedNumber(this.value, {super.key, required this.format, this.style});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.toDouble()),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeOutCubic,
      builder: (context, v, _) => Text(format(v), style: style, maxLines: 1, overflow: TextOverflow.ellipsis),
    );
  }
}

/// Stepper +/- grand format (saisie rapide des effectifs)
class CounterStepper extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final int value;
  final ValueChanged<int> onChanged;
  const CounterStepper({super.key, required this.label, required this.icon, required this.color, required this.value, required this.onChanged});

  /// Saisie directe au clavier (toucher le nombre) : indispensable pour les grandes assemblées.
  Future<void> _typeValue(BuildContext context) async {
    final ctrl = TextEditingController(text: value == 0 ? '' : '$value');
    final p = Palette.of(context);
    final result = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: p.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: Text(label, style: TextStyle(fontWeight: FontWeight.w900, color: p.text)),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: p.text),
          decoration: const InputDecoration(hintText: '0'),
          onSubmitted: (v) => Navigator.pop(ctx, int.tryParse(v) ?? 0),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: color),
            onPressed: () => Navigator.pop(ctx, int.tryParse(ctrl.text) ?? 0),
            child: const Text('Valider', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
    if (result != null) onChanged(result.clamp(0, 99999));
  }

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    Widget btn(IconData i, int delta) => Pressable(
          onTap: () => onChanged((value + delta).clamp(0, 99999)),
          onLongPress: () => onChanged((value + delta * 10).clamp(0, 99999)),
          child: Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: delta > 0 ? color : p.surfaceHigh,
              borderRadius: BorderRadius.circular(14),
              border: delta > 0 ? null : Border.all(color: p.border),
            ),
            child: Icon(i, size: 20, color: delta > 0 ? Colors.white : p.text),
          ),
        );
    return AppCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
      child: Row(children: [
        IconChip(icon, color: color, size: 42),
        const SizedBox(width: 12),
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => _typeValue(context),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(label, style: TextStyle(fontWeight: FontWeight.w700, color: p.textMuted, fontSize: 13)),
                const SizedBox(width: 6),
                Icon(LucideIcons.pencil, size: 11, color: p.textFaint),
              ]),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                child: Text('$value',
                    key: ValueKey(value), style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: p.text)),
              ),
            ]),
          ),
        ),
        btn(LucideIcons.minus, -1),
        const SizedBox(width: 8),
        btn(LucideIcons.plus, 1),
      ]),
    );
  }
}
