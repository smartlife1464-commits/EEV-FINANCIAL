import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/models.dart';
import 'storage.dart';

class ApiException implements Exception {
  final String message;
  final int? status;
  const ApiException(this.message, {this.status});

  /// Absence de réseau ou serveur injoignable (et non refus métier)
  bool get isNetwork => status == null;
  bool get isAuth => status == 401;

  @override
  String toString() => message;
}

/// Client de l'API EEV. Contrairement à l'ancienne version, aucune erreur n'est masquée
/// par une liste vide : l'interface affiche un état d'erreur explicite avec « Réessayer ».
class Api {
  Api._();

  /// Notifié lorsqu'un jeton expire ou qu'un compte est désactivé (déconnexion automatique).
  static final StreamController<void> sessionExpired = StreamController.broadcast();

  static Future<dynamic> _send(String method, String path, {Map<String, dynamic>? body, Map<String, String>? query}) async {
    final base = await Storage.apiUrl();
    final token = await Storage.token();
    var uri = Uri.parse('$base$path');
    if (query != null && query.isNotEmpty) {
      uri = uri.replace(queryParameters: {...uri.queryParameters, ...query});
    }
    final headers = {
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };

    http.Response res;
    try {
      final req = http.Request(method, uri)..headers.addAll(headers);
      if (body != null) req.body = jsonEncode(body);
      final streamed = await http.Client().send(req).timeout(const Duration(seconds: 15));
      res = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw const ApiException('Le serveur met trop de temps à répondre. Vérifiez votre connexion.');
    } catch (_) {
      throw const ApiException('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
    }

    final text = utf8.decode(res.bodyBytes);
    dynamic data;
    if (text.isNotEmpty) {
      try {
        data = jsonDecode(text);
      } catch (_) {
        data = null;
      }
    }

    if (res.statusCode >= 200 && res.statusCode < 300) return data;

    final message = _message(data) ?? 'Erreur serveur (${res.statusCode})';
    final authFailure = res.statusCode == 401 || (res.statusCode == 403 && message.contains('désactivé'));
    if (authFailure && token != null && !path.startsWith('/auth/')) {
      await Storage.clearSession();
      sessionExpired.add(null);
    }
    throw ApiException(message, status: res.statusCode);
  }

  /// Transforme une erreur Zod ({ champ: { _errors: [...] } }) en phrase lisible.
  static String? _message(dynamic data) {
    if (data is! Map) return null;
    final err = data['error'] ?? data['message'];
    if (err is String) return err;
    final msgs = <String>{};
    void walk(dynamic node) {
      if (node is! Map) return;
      final e = node['_errors'];
      if (e is List) msgs.addAll(e.map((x) => '$x'));
      for (final entry in node.entries) {
        if (entry.key != '_errors') walk(entry.value);
      }
    }

    walk(err);
    return msgs.isEmpty ? null : msgs.join(' • ');
  }

  static Future<Map<String, dynamic>> _map(String method, String path, {Map<String, dynamic>? body, Map<String, String>? query}) async {
    final d = await _send(method, path, body: body, query: query);
    return d is Map ? Map<String, dynamic>.from(d) : <String, dynamic>{};
  }

  static Future<List<Map<String, dynamic>>> _list(String path, {Map<String, String>? query}) async {
    final d = await _send('GET', path, query: query);
    if (d is! List) return const [];
    return d.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  static Map<String, String> _period(String period) => {'period': period};

  // ---------------------------------------------------------------- Authentification
  static Future<(String, AppUser)> login(String email, String password) async {
    final r = await _map('POST', '/auth/login', body: {'email': email, 'password': password});
    return (r.s('token'), AppUser.fromJson(r.obj('user')));
  }

  static Future<AppUser> me() async => AppUser.fromJson((await _map('GET', '/auth/me')).obj('user'));

  static Future<Map<String, dynamic>> requestPasswordReset(String email) =>
      _map('POST', '/auth/request-password-reset', body: {'email': email});

  static Future<Map<String, dynamic>> verifyOtp(String email, String otp) =>
      _map('POST', '/auth/verify-otp', body: {'email': email, 'otp': otp});

  static Future<Map<String, dynamic>> resetPassword(String email, String resetToken, String newPassword) =>
      _map('POST', '/auth/reset-password', body: {'email': email, 'resetToken': resetToken, 'newPassword': newPassword});

  // ---------------------------------------------------------------- Tableaux de bord
  static Future<Map<String, dynamic>> overview(String period) => _map('GET', '/dashboard/overview', query: _period(period));
  static Future<Map<String, dynamic>> financeDashboard(String period) => _map('GET', '/dashboard/finance', query: _period(period));
  static Future<Map<String, dynamic>> attendanceDashboard(String period) =>
      _map('GET', '/dashboard/attendance', query: _period(period));

  // ---------------------------------------------------------------- Finances
  static Future<Map<String, dynamic>> treasury() => _map('GET', '/finance/overview');
  static Future<List<Map<String, dynamic>>> funds() => _list('/finance/funds');
  static Future<Map<String, dynamic>> fundDetail(String id) => _map('GET', '/finance/funds/$id');
  static Future<Map<String, dynamic>> createFund(Map<String, dynamic> data) => _map('POST', '/finance/funds', body: data);
  static Future<Map<String, dynamic>> updateFund(String id, Map<String, dynamic> data) =>
      _map('PATCH', '/finance/funds/$id', body: data);
  static Future<List<Map<String, dynamic>>> revenueCategories() => _list('/finance/categories');
  static Future<List<Map<String, dynamic>>> expenseCategories() => _list('/finance/expense-categories');
  static Future<List<Map<String, dynamic>>> entries() => _list('/finance/entries');
  static Future<List<Map<String, dynamic>>> expenses() => _list('/finance/expenses');
  static Future<Map<String, dynamic>> createEntry(Map<String, dynamic> data) => _map('POST', '/finance/entries', body: data);
  static Future<Map<String, dynamic>> createExpense(Map<String, dynamic> data) => _map('POST', '/finance/expenses', body: data);
  static Future<Map<String, dynamic>> decideExpense(String id, String decision, {String? reason}) =>
      _map('POST', '/finance/expenses/$id/approve', body: {'decision': decision, 'reason': ?reason});
  static Future<Map<String, dynamic>> payExpense(String id, String method, {String? reference}) =>
      _map('POST', '/finance/expenses/$id/pay', body: {'paymentMethod': method, 'paymentReference': ?reference});

  // ---------------------------------------------------------------- Fréquentation
  static Future<List<Map<String, dynamic>>> serviceTypes() => _list('/service-types');
  static Future<List<Map<String, dynamic>>> attendanceSheets() => _list('/attendance');
  static Future<Map<String, dynamic>> createSheet(Map<String, dynamic> data) => _map('POST', '/attendance/structured', body: data);
  static Future<Map<String, dynamic>> decideSheet(String id, String decision, {String? reason}) =>
      _map('POST', '/attendance/$id/validate', body: {'decision': decision, 'reason': ?reason});

  // ---------------------------------------------------------------- Divers
  static Future<List<Map<String, dynamic>>> notifications() => _list('/notifications');
  static Future<Map<String, dynamic>> settings() => _map('GET', '/settings');

  // ---------------------------------------------------------------- Plateforme (configuration de l'église)
  static Future<Map<String, dynamic>> platformPublic() => _map('GET', '/platform/public');
  static Future<Map<String, dynamic>> platformConfig() => _map('GET', '/platform/config');

  /// Test de connexion (écran de configuration du serveur)
  static Future<bool> ping(String baseUrl) async {
    try {
      final root = baseUrl.replaceAll(RegExp(r'/api/?$'), '');
      final r = await http.get(Uri.parse('$root/health')).timeout(const Duration(seconds: 6));
      return r.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
