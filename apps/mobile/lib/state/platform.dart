import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../core/platform_config.dart';
import '../data/api.dart';
import '../data/storage.dart';

/// Charge la configuration de l'église (au démarrage, à la connexion, au changement de serveur)
/// et la garde en cache pour un démarrage hors ligne.
class PlatformState extends ChangeNotifier {
  PlatformConfig get config => PlatformConfig.current;
  Map<String, dynamic>? _pub;
  Map<String, dynamic>? _full;

  Future<void> load({bool signedIn = false}) async {
    // Cache local d'abord (démarrage instantané, hors ligne)
    if (_pub == null) {
      final cached = await Storage.platformCache();
      if (cached != null) {
        try {
          final m = Map<String, dynamic>.from(jsonDecode(cached) as Map);
          _apply(Map<String, dynamic>.from(m['pub'] as Map), m['full'] is Map ? Map<String, dynamic>.from(m['full'] as Map) : null);
        } catch (_) {}
      }
    }
    try {
      final pub = await Api.platformPublic();
      Map<String, dynamic>? full = _full;
      if (signedIn) {
        try {
          full = await Api.platformConfig();
        } on ApiException {
          // Ventilation indisponible : la dernière connue reste en vigueur
        }
      }
      _apply(pub, full);
      await Storage.setPlatformCache(jsonEncode({'pub': pub, 'full': ?full}));
    } on ApiException {
      // Hors ligne : configuration en cache
    }
  }

  void _apply(Map<String, dynamic> pub, Map<String, dynamic>? full) {
    _pub = pub;
    _full = full;
    PlatformConfig.current = PlatformConfig.fromJson(pub, full);
    notifyListeners();
  }
}
