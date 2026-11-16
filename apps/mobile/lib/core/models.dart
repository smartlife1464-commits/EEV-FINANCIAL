import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'theme/app_colors.dart';

/// Lecture tolérante d'un JSON dynamique (les réponses API sont des cartes clé/valeur).
extension JsonRead on Map<String, dynamic> {
  Map<String, dynamic> obj(String key) {
    final v = this[key];
    return v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};
  }

  List<Map<String, dynamic>> list(String key) {
    final v = this[key];
    if (v is! List) return const [];
    return v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  num n(String key) {
    final v = this[key];
    if (v is num) return v;
    return num.tryParse('${v ?? ''}') ?? 0;
  }

  int i(String key) => n(key).round();
  String s(String key, [String fallback = '']) {
    final v = this[key];
    if (v == null) return fallback;
    final str = v.toString();
    return str.isEmpty ? fallback : str;
  }

  bool b(String key) => this[key] == true;

  /// Relation PocketBase : objet développé (expand) ou identifiant seul
  Map<String, dynamic> rel(String key) {
    final v = this[key];
    if (v is Map) return Map<String, dynamic>.from(v);
    final exp = obj('expand');
    return exp.obj(key);
  }
}

enum UserRole {
  admin('admin', 'Administrateur Général'),
  leadPastor('lead_pastor', 'Pasteur Principal'),
  financeLead('finance_lead', 'Responsable Finances'),
  cashier('cashier', 'Caissier'),
  protocolLead('protocol_lead', 'Responsable Protocole'),
  protocolAgent('protocol_agent', 'Agent Protocole'),
  auditor('auditor', 'Auditeur Interne');

  final String value;
  final String label;
  const UserRole(this.value, this.label);

  static UserRole parse(String v) =>
      UserRole.values.firstWhere((r) => r.value == v, orElse: () => UserRole.protocolAgent);

  bool get isProtocol => this == protocolLead || this == protocolAgent;
  bool get isFinanceDesk => this == financeLead || this == cashier;
  bool get isExecutive => this == leadPastor || this == admin || this == auditor;

  IconData get icon => switch (this) {
        admin => LucideIcons.settings,
        leadPastor => LucideIcons.crown,
        financeLead => LucideIcons.landmark,
        cashier => LucideIcons.banknote,
        protocolLead => LucideIcons.clipboardList,
        protocolAgent => LucideIcons.userRound,
        auditor => LucideIcons.shieldCheck,
      };

  Color get color => switch (this) {
        admin => AppColors.violet,
        leadPastor => AppColors.gold,
        financeLead => AppColors.success,
        cashier => AppColors.cyan,
        protocolLead => AppColors.info,
        protocolAgent => AppColors.info,
        auditor => AppColors.pink,
      };
}

/// Matrice de permissions renvoyée par l'API à la connexion (miroir de PERMISSIONS_MATRIX).
class Permissions {
  final Map<String, bool> _p;
  const Permissions(this._p);

  factory Permissions.fromJson(Map<String, dynamic>? json) =>
      Permissions({for (final e in (json ?? {}).entries) e.key: e.value == true});

  bool _has(String k) => _p[k] == true;
  bool get financeDashboard => _has('canViewDashboardFinance');
  bool get submitAttendance => _has('canSubmitAttendance');
  bool get validateAttendance => _has('canValidateAttendance');
  bool get createEntry => _has('canCreateFinancialEntry');
  bool get createExpense => _has('canCreateExpense');
  bool get approveExpense => _has('canApproveExpense');
  bool get payExpense => _has('canPayExpense');
  bool get createService => _has('canCreateService');

  Map<String, dynamic> toJson() => _p;
}

class AppUser {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final Permissions permissions;

  const AppUser({required this.id, required this.email, required this.name, required this.role, required this.permissions});

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j.s('id'),
        email: j.s('email'),
        name: j.s('name', j.s('email', 'Utilisateur')),
        role: UserRole.parse(j.s('role')),
        permissions: Permissions.fromJson(j.obj('permissions')),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role.value,
        'permissions': permissions.toJson(),
      };

  String get firstName => name.split(' ').first;

  /// Structuration de la caisse (créer un compartiment, lancer / clôturer une quête)
  bool get canManageFunds => role == UserRole.admin || role == UserRole.leadPastor || role == UserRole.financeLead;
  String get initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    return (parts.first[0] + (parts.length > 1 ? parts[1][0] : '')).toUpperCase();
  }
}

/// Statuts métier avec libellé, couleur et icône cohérents dans toute l'application.
class StatusStyle {
  final String label;
  final Color color;
  final IconData icon;
  const StatusStyle(this.label, this.color, this.icon);

  static StatusStyle expense(String status) => switch (status) {
        'pending_approval' => const StatusStyle('En attente', AppColors.warning, LucideIcons.hourglass),
        'approved' => const StatusStyle('Approuvée', AppColors.info, LucideIcons.badgeCheck),
        'paid' => const StatusStyle('Payée', AppColors.success, LucideIcons.circleCheck),
        'rejected' => const StatusStyle('Rejetée', AppColors.danger, LucideIcons.circleX),
        'cancelled' => const StatusStyle('Annulée', Color(0xFF64748B), LucideIcons.ban),
        _ => const StatusStyle('Brouillon', Color(0xFF64748B), LucideIcons.fileText),
      };

  static StatusStyle sheet(String status) => switch (status) {
        'validated' => const StatusStyle('Validée', AppColors.success, LucideIcons.badgeCheck),
        'submitted' => const StatusStyle('Soumise', AppColors.info, LucideIcons.send),
        'rejected' => const StatusStyle('Rejetée', AppColors.danger, LucideIcons.circleX),
        _ => const StatusStyle('Brouillon', AppColors.warning, LucideIcons.pencilLine),
      };
}

const paymentMethods = <String, (String, IconData)>{
  'cash': ('Espèces', LucideIcons.banknote),
  'mobile_money': ('Mobile Money', LucideIcons.smartphone),
  'bank_transfer': ('Virement', LucideIcons.landmark),
  'check': ('Chèque', LucideIcons.fileText),
};

IconData programIcon(String slug) {
  if (slug.startsWith('sunday')) return LucideIcons.church;
  if (slug.startsWith('tuesday')) return LucideIcons.bookOpen;
  if (slug.startsWith('thursday')) return LucideIcons.flame;
  if (slug.contains('camp')) return LucideIcons.tent;
  return LucideIcons.sparkles;
}
