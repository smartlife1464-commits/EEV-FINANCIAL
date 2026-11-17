import 'package:eev_mobile/core/format.dart';
import 'package:eev_mobile/core/models.dart';
import 'package:eev_mobile/core/rules.dart';
import 'package:eev_mobile/core/platform_config.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() {
  setUpAll(() => initializeDateFormatting('fr'));

  group('Règles métier', () {
    test('ventilation 80/10/10 exacte, reliquat au Fonds Général', () {
      final split = BusinessRules.allocate(1000001, BusinessRules.standardSplit);
      final byCode = {for (final a in split) a.fundCode: a.amount};
      expect(byCode['TITHE_OF_TITHES'], 100000);
      expect(byCode['WELFARE_AID'], 100000);
      expect(byCode['GENERAL'], 800001);
      expect(split.fold<int>(0, (s, a) => s + a.amount), 1000001);
    });

    test('ventilation paramétrée par l’église (70/20/10) et monnaie configurée', () {
      PlatformConfig.current = PlatformConfig.fromJson({
        'name': 'Église test',
        'currency': {'code': 'EUR', 'label': '€'},
        'roleLabels': {'lead_pastor': 'Berger principal'},
        'modules': {'campaigns': false},
      }, {
        'config': {
          'finance': {
            'split': [
              {'fundCode': 'GENERAL', 'percentage': 70, 'label': 'Fonctionnement'},
              {'fundCode': 'MISSIONS', 'percentage': 20, 'label': 'Missions'},
              {'fundCode': 'WELFARE_AID', 'percentage': 10, 'label': 'Aide'},
            ],
            'remainderFund': 'GENERAL',
          }
        }
      });
      addTearDown(() => PlatformConfig.current = PlatformConfig.fallback);
      final byCode = {for (final a in BusinessRules.allocate(100003, BusinessRules.standardSplit)) a.fundCode: a.amount};
      expect(byCode, {'GENERAL': 70003, 'MISSIONS': 20000, 'WELFARE_AID': 10000});
      expect(Fmt.fcfa(1500).replaceAll(RegExp(r'\s'), ' '), '1 500 €');
      expect(UserRole.leadPastor.label, 'Berger principal');
      expect(PlatformConfig.current.module('campaigns'), isFalse);
      expect(PlatformConfig.current.module('finance'), isTrue);
    });

    test('don affecté : 100 % au fonds cible, aucun prélèvement', () {
      final split = BusinessRules.allocate(500000, BusinessRules.directAllocated, targetFundCode: 'BUILDING', targetFundName: 'Auditorium');
      expect(split, hasLength(1));
      expect(split.single.fundCode, 'BUILDING');
      expect(split.single.amount, 500000);
    });

    test('total de fréquentation = H + F + J + E (visiteurs exclus)', () {
      expect(BusinessRules.attendanceTotal(men: 120, women: 180, youth: 80, children: 50), 430);
      expect(BusinessRules.attendanceTotal(men: -3, women: 2, youth: 0, children: 0), 2);
    });
  });

  group('Formatage', () {
    test('montants FCFA', () {
      expect(Fmt.fcfa(14600000).replaceAll(RegExp(r'\s'), ' '), '14 600 000 FCFA');
      expect(Fmt.fcfaCompact(14600000), '14,6 M');
      expect(Fmt.fcfaCompact(850000), '850 k');
      expect(Fmt.fcfaCompact(-2500000), '−2,50 M');
    });

    test('dates PocketBase et ISO', () {
      expect(Fmt.parse('2026-11-06 22:41:31.218Z'), isNotNull);
      expect(Fmt.parse('2026-11-06')?.day, 6);
      expect(Fmt.parse(''), isNull);
      expect(Fmt.date('2026-11-08', pattern: 'd MMM yyyy'), '8 nov. 2026');
    });

    test('pourcentages signés', () {
      expect(Fmt.percent(12.5, signed: true), '+12,5 %');
      expect(Fmt.percent(-4), '-4 %');
    });
  });

  group('Modèles', () {
    test('utilisateur et permissions depuis la réponse de connexion', () {
      final u = AppUser.fromJson({
        'id': 'u1',
        'email': 'pasteur@exemple.org',
        'name': 'Pasteur Principal',
        'role': 'lead_pastor',
        'permissions': {'canApproveExpense': true, 'canPayExpense': false},
      });
      expect(u.role, UserRole.leadPastor);
      expect(u.permissions.approveExpense, isTrue);
      expect(u.permissions.payExpense, isFalse);
      expect(u.initials, 'PP');
      expect(AppUser.fromJson(u.toJson()).permissions.approveExpense, isTrue);
    });

    test('relations PocketBase : objet développé ou bloc expand', () {
      final flat = <String, dynamic>{'category': {'name': 'Dîmes'}};
      final expanded = <String, dynamic>{'category': 'c1', 'expand': {'category': {'name': 'Offrandes'}}};
      expect(flat.rel('category').s('name'), 'Dîmes');
      expect(expanded.rel('category').s('name'), 'Offrandes');
      expect(<String, dynamic>{'amount': '1500'}.n('amount'), 1500);
    });

    test('rôle inconnu → profil le plus restreint', () {
      expect(UserRole.parse('inconnu'), UserRole.protocolAgent);
      expect(UserRole.protocolLead.isProtocol, isTrue);
      expect(UserRole.cashier.isFinanceDesk, isTrue);
    });
  });
}
