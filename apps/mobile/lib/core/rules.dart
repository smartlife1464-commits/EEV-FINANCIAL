// Règles métier (miroir exact de @eev/business-rules).
import 'platform_config.dart';

class AllocationLine {
  final String fundCode;
  final String label;
  final int amount;
  final int percentage;
  const AllocationLine(this.fundCode, this.label, this.amount, this.percentage);
}

abstract final class BusinessRules {
  static const standardSplit = 'standard_split_80_10_10';
  static const directAllocated = 'direct_allocated';

  /// TOTAL = HOMMES + FEMMES + JEUNES + ENFANTS.
  /// Les nouveaux visiteurs ne sont JAMAIS additionnés au total de fréquentation.
  static int attendanceTotal({required int men, required int women, required int youth, required int children}) {
    int pos(int v) => v < 0 ? 0 : v;
    return pos(men) + pos(women) + pos(youth) + pos(children);
  }

  /// Ventilation d'une recette brute (arithmétique entière exacte) selon la règle de l'église :
  /// chaque compartiment reçoit sa part arrondie à l'inférieur, le compartiment du reliquat reçoit
  /// le complément ; fonds affectés : 100 % au compartiment cible, sans prélèvement.
  static List<AllocationLine> allocate(int gross, String rule, {String? targetFundCode, String? targetFundName}) {
    final amount = gross < 0 ? 0 : gross;
    if (rule == standardSplit) {
      final cfg = PlatformConfig.current;
      final others = cfg.split.where((l) => l.fundCode != cfg.remainderFund).toList();
      final rem = cfg.split.firstWhere((l) => l.fundCode == cfg.remainderFund, orElse: () => cfg.split.first);
      final lines = [for (final l in others) AllocationLine(l.fundCode, l.label.isEmpty ? l.fundCode : l.label, (amount * l.percentage) ~/ 100, l.percentage)];
      final rest = amount - lines.fold<int>(0, (s, l) => s + l.amount);
      return [AllocationLine(rem.fundCode, rem.label.isEmpty ? rem.fundCode : rem.label, rest, rem.percentage), ...lines];
    }
    return [AllocationLine(targetFundCode ?? 'OTHER_DESIGNATED', targetFundName ?? 'Fonds affecté', amount, 100)];
  }
}
