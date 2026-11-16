import 'package:flutter/material.dart';
import '../data/storage.dart';

class PeriodOption {
  final String key;
  final String label;
  const PeriodOption(this.key, this.label);
}

const periodOptions = [
  PeriodOption('this_week', 'Semaine'),
  PeriodOption('this_month', 'Mois'),
  PeriodOption('last_month', 'Mois dernier'),
  PeriodOption('this_quarter', 'Trimestre'),
  PeriodOption('this_semester', 'Semestre'),
  PeriodOption('this_year', 'Année'),
  PeriodOption('last_30_days', '30 jours'),
  PeriodOption('last_12_months', '12 mois'),
];

/// Préférences d'affichage : thème clair / sombre / système et période d'analyse globale.
class Preferences extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.dark;
  String _period = 'this_month';

  ThemeMode get themeMode => _themeMode;
  String get period => _period;
  String get periodLabel => periodOptions.firstWhere((p) => p.key == _period, orElse: () => periodOptions[1]).label;

  Future<void> load() async {
    final t = await Storage.themeMode();
    _themeMode = ThemeMode.values.firstWhere((m) => m.name == t, orElse: () => ThemeMode.dark);
    _period = await Storage.period() ?? 'this_month';
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    await Storage.setThemeMode(mode.name);
  }

  Future<void> setPeriod(String key) async {
    if (key == _period) return;
    _period = key;
    notifyListeners();
    await Storage.setPeriod(key);
  }
}
