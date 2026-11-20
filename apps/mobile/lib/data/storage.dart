import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/models.dart';

/// Stockage local persistant (session, préférences, file hors-ligne).
abstract final class Storage {
  static const _token = 'eev.token';
  static const _user = 'eev.user';
  static const _apiUrl = 'eev.api_url';
  static const _onboarding = 'eev.onboarding_done';
  static const _theme = 'eev.theme_mode';
  static const _period = 'eev.period';
  static const _readNotifs = 'eev.read_notifications';
  static const _queue = 'eev.offline_queue';
  static const _lastEmail = 'eev.last_email';
  static const _platform = 'eev.platform_config';

  static SharedPreferences? _prefs;
  static Future<SharedPreferences> get _p async => _prefs ??= await SharedPreferences.getInstance();

  /// Serveur de l'église, fixé à la compilation : --dart-define=EEV_API_URL=https://…/api
  static const _buildApiUrl = String.fromEnvironment('EEV_API_URL');

  /// URL par défaut : celle de la compilation, sinon émulateur Android → 10.0.2.2 ;
  /// web / iOS / desktop → localhost. Reste modifiable dans « Configuration du serveur ».
  static String get defaultApiUrl {
    if (_buildApiUrl.isNotEmpty) return _buildApiUrl;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) return 'http://10.0.2.2:4000/api';
    return 'http://localhost:4000/api';
  }

  static Future<String?> token() async => (await _p).getString(_token);
  static Future<AppUser?> user() async {
    final raw = (await _p).getString(_user);
    if (raw == null) return null;
    try {
      return AppUser.fromJson(Map<String, dynamic>.from(jsonDecode(raw) as Map));
    } catch (_) {
      return null;
    }
  }

  static Future<void> saveSession(String token, AppUser user) async {
    final p = await _p;
    await p.setString(_token, token);
    await p.setString(_user, jsonEncode(user.toJson()));
  }

  static Future<void> clearSession() async {
    final p = await _p;
    await p.remove(_token);
    await p.remove(_user);
  }

  static Future<String?> platformCache() async => (await _p).getString(_platform);
  static Future<void> setPlatformCache(String json) async => (await _p).setString(_platform, json);

  static Future<String> apiUrl() async => (await _p).getString(_apiUrl) ?? defaultApiUrl;
  static Future<void> setApiUrl(String? url) async {
    final p = await _p;
    if (url == null || url.trim().isEmpty) {
      await p.remove(_apiUrl);
    } else {
      await p.setString(_apiUrl, url.trim().replaceAll(RegExp(r'/+$'), ''));
    }
  }

  static Future<bool> onboardingDone() async => (await _p).getBool(_onboarding) ?? false;
  static Future<void> setOnboardingDone() async => (await _p).setBool(_onboarding, true);

  static Future<String?> themeMode() async => (await _p).getString(_theme);
  static Future<void> setThemeMode(String v) async => (await _p).setString(_theme, v);

  static Future<String?> period() async => (await _p).getString(_period);
  static Future<void> setPeriod(String v) async => (await _p).setString(_period, v);

  static Future<String?> lastEmail() async => (await _p).getString(_lastEmail);
  static Future<void> setLastEmail(String v) async => (await _p).setString(_lastEmail, v);

  static Future<Set<String>> readNotifications(String userId) async =>
      ((await _p).getStringList('$_readNotifs.$userId') ?? const []).toSet();
  static Future<void> saveReadNotifications(String userId, Set<String> ids) async {
    final list = ids.toList();
    await (await _p).setStringList('$_readNotifs.$userId', list.length > 500 ? list.sublist(list.length - 500) : list);
  }

  static Future<List<Map<String, dynamic>>> queue() async {
    final raw = (await _p).getString(_queue);
    if (raw == null) return [];
    try {
      return (jsonDecode(raw) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveQueue(List<Map<String, dynamic>> items) async =>
      (await _p).setString(_queue, jsonEncode(items));
}
