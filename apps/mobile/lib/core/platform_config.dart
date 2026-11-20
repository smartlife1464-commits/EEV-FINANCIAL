import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';

/// Une ligne de la règle de ventilation des recettes ordinaires.
class SplitLine {
  final String fundCode;
  final int percentage;
  final String label;
  const SplitLine(this.fundCode, this.percentage, this.label);
}

/// Configuration de l'installation (une installation = une église), fixée par l'administrateur
/// de la plateforme : nom, logo, couleurs, monnaie, modules, libellés des rôles, ventilation.
class PlatformConfig {
  final String name;
  final String shortName;
  final String tagline;
  final String logo;
  final Color primary;
  final Color secondary;
  final String currencyCode;
  final String currencyLabel;
  final Map<String, bool> modules;
  final Map<String, String> roleLabels;
  final bool setupRequired;
  final List<SplitLine> split;
  final String remainderFund;

  const PlatformConfig({
    required this.name,
    this.shortName = '',
    this.tagline = '',
    this.logo = '',
    this.primary = const Color(0xFFFFBC00),
    this.secondary = const Color(0xFF091338),
    this.currencyCode = 'XAF',
    this.currencyLabel = 'FCFA',
    this.modules = const {},
    this.roleLabels = const {},
    this.setupRequired = false,
    this.split = defaultSplit,
    this.remainderFund = 'GENERAL',
  });

  static const defaultSplit = [
    SplitLine('GENERAL', 80, 'Fonds général'),
    SplitLine('TITHE_OF_TITHES', 10, 'Dîme des dîmes'),
    SplitLine('WELFARE_AID', 10, 'Aide sociale'),
  ];

  static const fallback = PlatformConfig(name: 'Gestion d’église');

  /// Configuration courante, lue par le formatage des montants et les règles métier.
  static PlatformConfig current = fallback;

  String get displayName => shortName.isNotEmpty ? shortName : name;
  bool module(String key) => modules[key] != false;
  String roleLabel(String role, String fallbackLabel) => roleLabels[role]?.isNotEmpty == true ? roleLabels[role]! : fallbackLabel;
  String get splitLabel => split.map((l) => '${l.percentage}').join(' / ');

  /// Logo décodé (image encodée) — null si absent ou si c'est une URL
  Uint8List? get logoBytes {
    if (!logo.startsWith('data:image/')) return null;
    final i = logo.indexOf('base64,');
    if (i < 0) return null;
    try {
      return base64Decode(logo.substring(i + 7));
    } catch (_) {
      return null;
    }
  }

  static Color _color(Object? v, Color fallback) {
    final s = '${v ?? ''}'.replaceAll('#', '');
    if (s.length != 6) return fallback;
    final n = int.tryParse(s, radix: 16);
    return n == null ? fallback : Color(0xFF000000 | n);
  }

  /// Fusion de la configuration publique (/platform/public) et, si connecté, de la configuration
  /// complète (/platform/config : ventilation).
  factory PlatformConfig.fromJson(Map<String, dynamic> pub, [Map<String, dynamic>? full]) {
    final colors = pub['colors'] is Map ? Map<String, dynamic>.from(pub['colors'] as Map) : const <String, dynamic>{};
    final currency = pub['currency'] is Map ? Map<String, dynamic>.from(pub['currency'] as Map) : const <String, dynamic>{};
    final finance = (full?['config'] is Map && (full!['config'] as Map)['finance'] is Map)
        ? Map<String, dynamic>.from((full['config'] as Map)['finance'] as Map)
        : null;
    final split = <SplitLine>[];
    if (finance?['split'] is List) {
      for (final l in (finance!['split'] as List).whereType<Map>()) {
        split.add(SplitLine('${l['fundCode']}', (l['percentage'] as num?)?.round() ?? 0, '${l['label'] ?? ''}'));
      }
    }
    return PlatformConfig(
      name: '${pub['name'] ?? fallback.name}',
      shortName: '${pub['shortName'] ?? ''}',
      tagline: '${pub['tagline'] ?? ''}',
      logo: '${pub['logo'] ?? ''}',
      primary: _color(colors['primary'], fallback.primary),
      secondary: _color(colors['secondary'], fallback.secondary),
      currencyCode: '${currency['code'] ?? 'XAF'}',
      currencyLabel: '${currency['label'] ?? 'FCFA'}',
      modules: pub['modules'] is Map ? Map<String, dynamic>.from(pub['modules'] as Map).map((k, v) => MapEntry(k, v != false)) : const {},
      roleLabels: pub['roleLabels'] is Map ? Map<String, dynamic>.from(pub['roleLabels'] as Map).map((k, v) => MapEntry(k, '$v')) : const {},
      setupRequired: pub['setupRequired'] == true,
      split: split.isEmpty ? defaultSplit : split,
      remainderFund: '${finance?['remainderFund'] ?? 'GENERAL'}',
    );
  }
}
