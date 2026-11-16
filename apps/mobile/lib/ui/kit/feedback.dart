import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme/app_colors.dart';
import '../../data/api.dart';
import 'controls.dart';
import 'surfaces.dart';

/// Chargement asynchrone avec états squelette / erreur / données et rafraîchissement.
class Loader<T> extends StatefulWidget {
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data, Future<void> Function() reload) builder;
  final Widget? skeleton;
  final Object? reloadKey;

  const Loader({super.key, required this.load, required this.builder, this.skeleton, this.reloadKey});

  @override
  State<Loader<T>> createState() => _LoaderState<T>();
}

class _LoaderState<T> extends State<Loader<T>> {
  T? _data;
  Object? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  @override
  void didUpdateWidget(covariant Loader<T> old) {
    super.didUpdateWidget(old);
    if (old.reloadKey != widget.reloadKey) _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = _data == null;
      _error = null;
    });
    try {
      final d = await widget.load();
      if (!mounted) return;
      setState(() {
        _data = d;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _data == null) return widget.skeleton ?? const SkeletonList();
    if (_error != null && _data == null) {
      return ErrorState(message: _error is ApiException ? '$_error' : 'Une erreur inattendue est survenue.', onRetry: _fetch);
    }
    return widget.builder(context, _data as T, _fetch);
  }
}

class Skeleton extends StatelessWidget {
  final double height;
  final double? width;
  final double radius;
  const Skeleton({super.key, this.height = 16, this.width, this.radius = 14});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(color: p.surfaceHigh, borderRadius: BorderRadius.circular(radius)),
    )
        .animate(onPlay: (c) => c.repeat())
        .shimmer(duration: 1400.ms, color: p.dark ? Colors.white.withValues(alpha: 0.06) : Colors.white.withValues(alpha: 0.7));
  }
}

class SkeletonList extends StatelessWidget {
  final int count;
  final bool hero;
  const SkeletonList({super.key, this.count = 4, this.hero = false});

  @override
  Widget build(BuildContext context) {
    // Défilement neutralisé : le squelette ne déborde jamais, quelle que soit la hauteur disponible
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(children: [
        if (hero) ...[const Skeleton(height: 190, radius: 30), const SizedBox(height: 16)],
        Row(children: const [
          Expanded(child: Skeleton(height: 110, radius: 24)),
          SizedBox(width: 12),
          Expanded(child: Skeleton(height: 110, radius: 24)),
        ]),
        const SizedBox(height: 16),
        for (var i = 0; i < count; i++) ...[const Skeleton(height: 74, radius: 22), const SizedBox(height: 12)],
      ]),
    );
  }
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final Widget? action;
  const EmptyState({super.key, required this.icon, required this.title, required this.message, this.action});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 36),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [AppColors.gold.withValues(alpha: 0.25), AppColors.gold.withValues(alpha: 0.02)]),
          ),
          child: Icon(icon, size: 36, color: p.accent),
        ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
        const SizedBox(height: 18),
        Text(title, textAlign: TextAlign.center, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: p.text)),
        const SizedBox(height: 6),
        Text(message, textAlign: TextAlign.center, style: TextStyle(color: p.textMuted, height: 1.45)),
        if (action != null) ...[const SizedBox(height: 18), action!],
      ]),
    );
  }
}

class ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const ErrorState({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: LucideIcons.cloudOff,
      title: 'Données indisponibles',
      message: message,
      action: SizedBox(
        width: 200,
        child: SecondaryButton(label: 'Réessayer', icon: LucideIcons.refreshCw, onPressed: onRetry),
      ),
    );
  }
}

enum ToastKind { success, error, info }

void showToast(BuildContext context, String message, {ToastKind kind = ToastKind.success, String? detail}) {
  final color = switch (kind) {
    ToastKind.success => AppColors.success,
    ToastKind.error => AppColors.danger,
    ToastKind.info => AppColors.gold,
  };
  final icon = switch (kind) {
    ToastKind.success => LucideIcons.circleCheck,
    ToastKind.error => LucideIcons.circleAlert,
    ToastKind.info => LucideIcons.info,
  };
  kind == ToastKind.error ? HapticFeedback.heavyImpact() : HapticFeedback.lightImpact();
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 110),
      duration: const Duration(seconds: 4),
      content: Row(children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Text(message, style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
            if (detail != null) Text(detail, style: const TextStyle(color: Colors.white70, fontSize: 12.5)),
          ]),
        ),
      ]),
    ));
}

/// Feuille modale arrondie avec poignée
Future<T?> showAppSheet<T>(BuildContext context, {required Widget Function(BuildContext) builder}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      final p = Palette.of(ctx);
      return Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          decoration: BoxDecoration(
            color: p.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border.all(color: p.border),
          ),
          child: SafeArea(
            top: false,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const SizedBox(height: 10),
              Container(width: 44, height: 5, decoration: BoxDecoration(color: p.border, borderRadius: BorderRadius.circular(5))),
              Flexible(child: builder(ctx)),
            ]),
          ),
        ),
      );
    },
  );
}

/// Demande d'un motif (rejets) — renvoie null si annulé
Future<String?> askReason(BuildContext context, {required String title, String hint = 'Motif communiqué au demandeur'}) {
  final ctrl = TextEditingController();
  return showAppSheet<String>(context, builder: (ctx) {
    final p = Palette.of(ctx);
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: p.text)),
        const SizedBox(height: 14),
        AppField(controller: ctrl, label: 'Motif', hint: hint, icon: LucideIcons.messageSquareText, maxLines: 3),
        const SizedBox(height: 18),
        PrimaryButton(
          label: 'Confirmer le rejet',
          icon: LucideIcons.circleX,
          color: AppColors.danger,
          onPressed: () {
            final v = ctrl.text.trim();
            if (v.isEmpty) return;
            Navigator.pop(ctx, v);
          },
        ),
      ]),
    );
  });
}

/// Confirmation simple
Future<bool> confirmAction(BuildContext context, {required String title, required String message, String confirmLabel = 'Confirmer', IconData icon = LucideIcons.circleCheck}) async {
  final r = await showAppSheet<bool>(context, builder: (ctx) {
    final p = Palette.of(ctx);
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        IconChip(icon, color: AppColors.gold, size: 58),
        const SizedBox(height: 14),
        Text(title, textAlign: TextAlign.center, style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: p.text)),
        const SizedBox(height: 8),
        Text(message, textAlign: TextAlign.center, style: TextStyle(color: p.textMuted, height: 1.45)),
        const SizedBox(height: 20),
        PrimaryButton(label: confirmLabel, onPressed: () => Navigator.pop(ctx, true)),
        const SizedBox(height: 10),
        SecondaryButton(label: 'Annuler', onPressed: () => Navigator.pop(ctx, false)),
      ]),
    );
  });
  return r == true;
}
