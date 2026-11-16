import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';

/// Identité visuelle d'un compartiment (icône + couleur), y compris les quêtes créées par les utilisateurs.
class FundStyle {
  final IconData icon;
  final Color color;
  const FundStyle(this.icon, this.color);

  static const _byCode = {
    'GENERAL': FundStyle(LucideIcons.landmark, AppColors.info),
    'TITHE_OF_TITHES': FundStyle(LucideIcons.crown, AppColors.gold),
    'WELFARE_AID': FundStyle(LucideIcons.handHeart, AppColors.success),
    'BUILDING': FundStyle(LucideIcons.building2, AppColors.violet),
    'FRIENDS_OF_JESUS': FundStyle(LucideIcons.heartHandshake, AppColors.pink),
    'SPECIAL_OFFERING': FundStyle(LucideIcons.gift, AppColors.cyan),
  };

  /// Palette proposée lors de la création d'un compartiment ou d'une quête
  static const choices = [AppColors.gold, AppColors.info, AppColors.success, AppColors.pink, AppColors.violet, AppColors.cyan, Color(0xFFF97316)];

  static Color? parseColor(String hex) {
    if (!RegExp(r'^#[0-9A-Fa-f]{6}$').hasMatch(hex)) return null;
    return Color(int.parse('FF${hex.substring(1)}', radix: 16));
  }

  static String toHex(Color c) => '#${(c.toARGB32() & 0xFFFFFF).toRadixString(16).padLeft(6, '0').toUpperCase()}';

  static FundStyle of({required String code, String kind = 'permanent', String color = ''}) {
    final custom = parseColor(color);
    final known = _byCode[code];
    if (known != null) return custom == null ? known : FundStyle(known.icon, custom);
    if (kind == 'campaign') return FundStyle(LucideIcons.target, custom ?? const Color(0xFFF97316));
    return FundStyle(LucideIcons.piggyBank, custom ?? AppColors.cyan);
  }

  /// Variante à partir d'un élément `funds[]` de la synthèse de trésorerie
  static FundStyle ofTreasury(Map<String, dynamic> fund) {
    final a = fund['account'] is Map ? Map<String, dynamic>.from(fund['account'] as Map) : <String, dynamic>{};
    return of(code: '${a['code'] ?? ''}', kind: '${a['kind'] ?? 'permanent'}', color: '${a['color'] ?? ''}');
  }
}

/// Libellé et couleur de l'état d'une quête
(String, Color, IconData) campaignStateStyle(String state) => switch (state) {
      'reached' => ('Objectif atteint', AppColors.success, LucideIcons.partyPopper),
      'expired' => ('Délai dépassé', AppColors.danger, LucideIcons.alarmClockOff),
      'closed' => ('Clôturée', const Color(0xFF64748B), LucideIcons.lock),
      _ => ('En cours', AppColors.gold, LucideIcons.hourglass),
    };
