// Règles métier du Ministère Esprit & Vie (miroir exact de @eev/business-rules).

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

  /// Ventilation d'une recette brute en FCFA (arithmétique entière exacte) :
  /// recettes ordinaires 10 % Dîme des dîmes, 10 % Aide sociale, 80 % Fonds général (reliquat) ;
  /// fonds affectés 100 % au compartiment cible, sans prélèvement.
  static List<AllocationLine> allocate(int gross, String rule, {String? targetFundCode, String? targetFundName}) {
    final amount = gross < 0 ? 0 : gross;
    if (rule == standardSplit) {
      final tithe = (amount * 10) ~/ 100;
      final aid = (amount * 10) ~/ 100;
      return [
        AllocationLine('GENERAL', 'Fonds Général', amount - tithe - aid, 80),
        AllocationLine('TITHE_OF_TITHES', 'Dîme des Dîmes', tithe, 10),
        AllocationLine('WELFARE_AID', 'Aide Sociale', aid, 10),
      ];
    }
    return [AllocationLine(targetFundCode ?? 'OTHER_DESIGNATED', targetFundName ?? 'Fonds affecté', amount, 100)];
  }
}
