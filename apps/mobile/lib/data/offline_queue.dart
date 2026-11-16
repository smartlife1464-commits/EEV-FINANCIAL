import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import 'api.dart';
import 'storage.dart';

enum QueueKind { entry, expense, sheet }

class QueuedItem {
  final String id;
  final QueueKind kind;
  final Map<String, dynamic> data;
  final String label;
  final String queuedAt;
  final String? error;

  const QueuedItem({required this.id, required this.kind, required this.data, required this.label, required this.queuedAt, this.error});

  factory QueuedItem.fromJson(Map<String, dynamic> j) => QueuedItem(
        id: j['id'] as String,
        kind: QueueKind.values.byName(j['kind'] as String),
        data: Map<String, dynamic>.from(j['data'] as Map),
        label: (j['label'] ?? '') as String,
        queuedAt: (j['queuedAt'] ?? '') as String,
        error: j['error'] as String?,
      );

  Map<String, dynamic> toJson() =>
      {'id': id, 'kind': kind.name, 'data': data, 'label': label, 'queuedAt': queuedAt, 'error': error};

  QueuedItem withError(String? e) => QueuedItem(id: id, kind: kind, data: data, label: label, queuedAt: queuedAt, error: e);
}

class SyncReport {
  final int synced;
  final int failed;
  final int pending;
  const SyncReport(this.synced, this.failed, this.pending);
}

/// File d'attente hors-ligne : les saisies faites sans réseau sont conservées sur l'appareil
/// et envoyées au retour de la connexion. Un refus métier (doublon, validation) n'est plus
/// supprimé en silence : l'élément reste visible avec le motif, pour correction ou suppression.
class OfflineQueue extends ChangeNotifier {
  static const _uuid = Uuid();
  List<QueuedItem> _items = [];
  bool _syncing = false;

  List<QueuedItem> get items => List.unmodifiable(_items);
  int get pendingCount => _items.where((i) => i.error == null).length;
  int get failedCount => _items.where((i) => i.error != null).length;
  bool get syncing => _syncing;

  Future<void> load() async {
    _items = (await Storage.queue()).map(QueuedItem.fromJson).toList();
    notifyListeners();
  }

  Future<void> _persist() async {
    await Storage.saveQueue(_items.map((e) => e.toJson()).toList());
    notifyListeners();
  }

  Future<void> add(QueueKind kind, Map<String, dynamic> data, String label) async {
    _items = [
      ..._items,
      QueuedItem(id: _uuid.v4(), kind: kind, data: data, label: label, queuedAt: DateTime.now().toIso8601String()),
    ];
    await _persist();
  }

  Future<void> remove(String id) async {
    _items = _items.where((i) => i.id != id).toList();
    await _persist();
  }

  Future<SyncReport> sync() async {
    if (_syncing) return SyncReport(0, failedCount, pendingCount);
    _syncing = true;
    notifyListeners();
    var synced = 0;
    final next = <QueuedItem>[];
    for (final item in _items) {
      try {
        switch (item.kind) {
          case QueueKind.entry:
            await Api.createEntry(item.data);
          case QueueKind.expense:
            await Api.createExpense(item.data);
          case QueueKind.sheet:
            await Api.createSheet(item.data);
        }
        synced++;
      } on ApiException catch (e) {
        next.add(e.isNetwork ? item : item.withError(e.message));
      }
    }
    _items = next;
    _syncing = false;
    await _persist();
    return SyncReport(synced, failedCount, pendingCount);
  }
}
