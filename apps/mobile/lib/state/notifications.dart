import 'dart:async';
import 'package:flutter/foundation.dart';
import '../data/api.dart';
import '../data/storage.dart';

/// Centre de notifications : alertes calculées par le serveur selon le rôle,
/// actualisées toutes les 60 s, avec état « lu » mémorisé par utilisateur.
class NotificationsCenter extends ChangeNotifier {
  List<Map<String, dynamic>> _items = [];
  Set<String> _read = {};
  String? _userId;
  Timer? _timer;
  bool loading = false;
  String? error;

  List<Map<String, dynamic>> get items => _items;
  bool isRead(String id) => _read.contains(id);
  int get unreadCount => _items.where((n) => !_read.contains(n['id'])).length;

  Future<void> start(String userId) async {
    if (_userId == userId && _timer != null) return;
    _userId = userId;
    _read = await Storage.readNotifications(userId);
    await refresh();
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => refresh());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _items = [];
    _userId = null;
    notifyListeners();
  }

  Future<void> refresh() async {
    loading = true;
    notifyListeners();
    try {
      _items = await Api.notifications();
      error = null;
    } on ApiException catch (e) {
      error = e.message;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(String id) async {
    if (_userId == null || _read.contains(id)) return;
    _read = {..._read, id};
    notifyListeners();
    await Storage.saveReadNotifications(_userId!, _read);
  }

  Future<void> markAllRead() async {
    if (_userId == null) return;
    _read = {..._read, ..._items.map((n) => n['id'] as String)};
    notifyListeners();
    await Storage.saveReadNotifications(_userId!, _read);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
