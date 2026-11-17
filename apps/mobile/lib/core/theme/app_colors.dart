import 'package:flutter/material.dart';

/// Palette par défaut de l'application (or #FFBC00 sur bleu nuit #091338),
/// déclinée pour une interface premium en mode clair et sombre.
abstract final class AppColors {
  // Identité
  static const gold = Color(0xFFFFBC00);
  static const goldLight = Color(0xFFFFD45C);
  static const goldDeep = Color(0xFFE09A00);
  static const navy = Color(0xFF091338);
  static const navyDeep = Color(0xFF050B22);
  static const navyMid = Color(0xFF0E1B4D);
  static const indigo = Color(0xFF2B3A8F);

  // Sémantique
  static const success = Color(0xFF10B981);
  static const danger = Color(0xFFF43F5E);
  static const warning = Color(0xFFF59E0B);
  static const info = Color(0xFF3B82F6);
  static const violet = Color(0xFF8B5CF6);
  static const pink = Color(0xFFEC4899);
  static const cyan = Color(0xFF06B6D4);

  // Surfaces sombres
  static const darkBg = Color(0xFF050B1F);
  static const darkSurface = Color(0xFF0B1534);
  static const darkSurfaceHigh = Color(0xFF111E45);
  static const darkBorder = Color(0xFF1B2A5C);

  // Surfaces claires
  static const lightBg = Color(0xFFF4F6FB);
  static const lightSurface = Colors.white;
  static const lightSurfaceHigh = Color(0xFFF8FAFD);
  static const lightBorder = Color(0xFFE5E9F2);

  static const goldGradient = LinearGradient(
    colors: [goldLight, gold, goldDeep],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const heroGradient = LinearGradient(
    colors: [Color(0xFF0E1B4D), Color(0xFF091338), Color(0xFF050B22)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Couleurs des séries de graphiques (lisibles en clair comme en sombre)
  static const chart = [gold, info, success, pink, violet, cyan, Color(0xFFF97316), Color(0xFF64748B)];
}

/// Couleurs contextuelles selon la luminosité du thème.
class Palette {
  final bool dark;
  const Palette(this.dark);

  factory Palette.of(BuildContext context) => Palette(Theme.of(context).brightness == Brightness.dark);

  Color get bg => dark ? AppColors.darkBg : AppColors.lightBg;
  Color get surface => dark ? AppColors.darkSurface : AppColors.lightSurface;
  Color get surfaceHigh => dark ? AppColors.darkSurfaceHigh : AppColors.lightSurfaceHigh;
  Color get border => dark ? AppColors.darkBorder : AppColors.lightBorder;
  Color get text => dark ? Colors.white : const Color(0xFF0B1230);
  Color get textMuted => dark ? const Color(0xFF94A3C4) : const Color(0xFF5B6684);
  Color get textFaint => dark ? const Color(0xFF5E6B91) : const Color(0xFF98A2BC);
  Color get accent => dark ? AppColors.gold : AppColors.goldDeep;
  Color get shadow => dark ? Colors.black.withValues(alpha: 0.45) : const Color(0xFF1B2A5C).withValues(alpha: 0.08);
}
