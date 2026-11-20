import 'package:intl/intl.dart';
import 'platform_config.dart';

/// Formatage localisé (fr) des montants (monnaie de l'église), nombres et dates.
abstract final class Fmt {
  static final _number = NumberFormat.decimalPattern('fr');
  static final _compact = NumberFormat.compact(locale: 'fr');

  /// L'espace fine insécable (U+202F) de la locale fr est trop étroite avec Plus Jakarta Sans :
  /// on utilise l'espace insécable classique, plus lisible (« 14 600 000 »).
  static String _spaced(String v) => v.replaceAll('\u202F', '\u00A0');

  static String fcfa(num? value) => '${number(value)} ${PlatformConfig.current.currencyLabel}';

  /// Symbole de la monnaie configurée (« FCFA », « € »…)
  static String get currency => PlatformConfig.current.currencyLabel;

  /// Montant compact pour les petits espaces : « 14,6 M », « 850 k »
  static String fcfaCompact(num? value) {
    final v = (value ?? 0).abs();
    final sign = (value ?? 0) < 0 ? '−' : '';
    if (v >= 1000000) return '$sign${(v / 1000000).toStringAsFixed(v >= 10000000 ? 1 : 2).replaceAll('.', ',')} M';
    if (v >= 1000) return '$sign${(v / 1000).round()} k';
    return '$sign${v.round()}';
  }

  static String number(num? value) => _spaced(_number.format((value ?? 0).round()));
  static String compact(num? value) => _compact.format(value ?? 0);

  static String percent(num? value, {bool signed = false}) {
    final v = (value ?? 0).toDouble();
    final s = v.toStringAsFixed(v.truncateToDouble() == v ? 0 : 1).replaceAll('.', ',');
    return '${signed && v > 0 ? '+' : ''}$s %';
  }

  /// Interprète les dates PocketBase (« 2026-11-06 22:41:31.218Z ») et ISO.
  static DateTime? parse(String? value) {
    if (value == null || value.isEmpty) return null;
    final v = value.length == 10 ? '${value}T12:00:00' : value.replaceFirst(' ', 'T');
    return DateTime.tryParse(v)?.toLocal();
  }

  static String date(String? value, {String pattern = 'd MMM yyyy'}) {
    final d = parse(value);
    return d == null ? '—' : DateFormat(pattern, 'fr').format(d);
  }

  static String dateTime(String? value) => date(value, pattern: "d MMM yyyy 'à' HH:mm");

  static String dayIso(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

  static String timeAgo(String? value) {
    final d = parse(value);
    if (d == null) return '';
    final diff = DateTime.now().difference(d);
    final future = diff.isNegative;
    final a = diff.abs();
    String unit;
    if (a.inDays >= 30) {
      unit = '${a.inDays ~/ 30} mois';
    } else if (a.inDays >= 1) {
      unit = '${a.inDays} jour${a.inDays > 1 ? 's' : ''}';
    } else if (a.inHours >= 1) {
      unit = '${a.inHours} h';
    } else if (a.inMinutes >= 1) {
      unit = '${a.inMinutes} min';
    } else {
      return future ? 'Bientôt' : "À l'instant";
    }
    return future ? 'Dans $unit' : 'Il y a $unit';
  }

  static String greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
}
