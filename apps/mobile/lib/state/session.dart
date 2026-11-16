import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/models.dart';
import '../data/api.dart';
import '../data/storage.dart';

enum SessionStatus { unknown, signedOut, signedIn }

/// Session utilisateur : restauration au démarrage, connexion, déconnexion automatique
/// lorsqu'un jeton expire ou qu'un compte est désactivé.
class Session extends ChangeNotifier {
  SessionStatus _status = SessionStatus.unknown;
  AppUser? _user;
  StreamSubscription<void>? _expiredSub;
  bool expiredNotice = false;

  SessionStatus get status => _status;
  AppUser? get user => _user;
  bool get isSignedIn => _status == SessionStatus.signedIn && _user != null;

  Future<void> restore() async {
    _expiredSub ??= Api.sessionExpired.stream.listen((_) {
      expiredNotice = true;
      _user = null;
      _status = SessionStatus.signedOut;
      notifyListeners();
    });

    final token = await Storage.token();
    final cached = await Storage.user();
    if (token == null || cached == null) {
      _status = SessionStatus.signedOut;
      notifyListeners();
      return;
    }
    _user = cached;
    _status = SessionStatus.signedIn;
    notifyListeners();

    // Revalidation silencieuse : rôle et permissions à jour, jeton encore valide
    try {
      final fresh = await Api.me();
      _user = fresh;
      await Storage.saveSession(token, fresh);
      notifyListeners();
    } on ApiException catch (e) {
      if (e.isAuth) await signOut();
      // Hors ligne : on conserve la session locale
    }
  }

  Future<void> signIn(String email, String password) async {
    final (token, user) = await Api.login(email.trim().toLowerCase(), password);
    await Storage.saveSession(token, user);
    await Storage.setLastEmail(email.trim().toLowerCase());
    _user = user;
    expiredNotice = false;
    _status = SessionStatus.signedIn;
    notifyListeners();
  }

  Future<void> signOut() async {
    await Storage.clearSession();
    _user = null;
    _status = SessionStatus.signedOut;
    notifyListeners();
  }

  @override
  void dispose() {
    _expiredSub?.cancel();
    super.dispose();
  }
}
