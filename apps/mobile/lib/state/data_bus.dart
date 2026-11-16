import 'package:flutter/foundation.dart';

/// Signal global « les données ont changé » : après une saisie ou une décision, tous les écrans
/// ouverts (onglets conservés en mémoire) se rechargent automatiquement.
class DataBus extends ChangeNotifier {
  int _version = 0;
  int get version => _version;

  void bump() {
    _version++;
    notifyListeners();
  }
}
