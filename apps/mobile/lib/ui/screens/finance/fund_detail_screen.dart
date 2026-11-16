import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../state/data_bus.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../shell/home_shell.dart';
import 'entry_form_screen.dart';
import 'fund_form_screen.dart';
import 'fund_style.dart';

/// Fiche complète d'un compartiment de caisse ou d'une quête spontanée.
class FundDetailScreen extends StatefulWidget {
  final String fundId;
  const FundDetailScreen({super.key, required this.fundId});

  @override
  State<FundDetailScreen> createState() => _FundDetailScreenState();
}

class _FundDetailScreenState extends State<FundDetailScreen> {
  int _tab = 0;
  int _reload = 0;

  @override
  Widget build(BuildContext context) {
    final version = context.watch<DataBus>().version;
    return Scaffold(
      body: AuroraBackground(
        child: Loader<Map<String, dynamic>>(
          reloadKey: '$_reload-$version',
          load: () => Api.fundDetail(widget.fundId),
          skeleton: const SafeArea(child: SkeletonList(hero: true)),
          builder: (context, d, reload) => _content(context, d, reload),
        ),
      ),
    );
  }

  Widget _content(BuildContext context, Map<String, dynamic> d, Future<void> Function() reload) {
    final p = Palette.of(context);
    final user = context.read<Session>().user!;
    final fund = d.obj('fund');
    final stats = d.obj('stats');
    final campaign = d['campaign'] is Map ? d.obj('campaign') : null;
    final style = FundStyle.of(code: fund.s('code'), kind: fund.s('kind'), color: fund.s('color'));
    final category = fund.obj('revenueCategory');
    final closed = fund.s('status') == 'closed';
    final canCollect = user.permissions.createEntry && category.isNotEmpty && !closed;
    final monthly = d.list('monthly').map((m) => TrendPoint(m.s('label'), m.n('credits').toDouble(), m.n('debits').toDouble())).toList();

    return ScrollPage(
      showBack: true,
      title: fund.s('name'),
      subtitle: campaign != null ? 'Quête spontanée' : (fund.b('isRestricted') ? 'Compartiment affecté' : 'Compartiment de fonctionnement'),
      onRefresh: reload,
      actions: [
        if (user.canManageFunds && campaign != null)
          RoundIconButton(
            icon: LucideIcons.pencil,
            tooltip: 'Modifier la quête',
            onTap: () async {
              final ok = await pushPage<bool>(context, FundFormScreen(existing: fund));
              if (ok == true) setState(() => _reload++);
            },
          ),
      ],
      children: [
        _Hero(fund: fund, stats: stats, campaign: campaign, style: style),
        const SizedBox(height: 16),
        Gutter(
          child: Row(children: [
            if (canCollect)
              Expanded(
                child: PrimaryButton(
                  label: campaign != null ? 'Collecter' : 'Encaisser',
                  icon: LucideIcons.handCoins,
                  onPressed: () => pushPage(context, EntryFormScreen(initialCategoryId: category.s('id'))),
                ),
              ),
            if (canCollect && user.canManageFunds && campaign != null) const SizedBox(width: 10),
            if (user.canManageFunds && campaign != null)
              Expanded(
                child: SecondaryButton(
                  label: closed ? 'Rouvrir' : 'Clôturer',
                  icon: closed ? LucideIcons.lockOpen : LucideIcons.lock,
                  color: closed ? AppColors.success : AppColors.danger,
                  onPressed: () => _toggleStatus(context, fund, closed),
                ),
              ),
          ]),
        ),
        const SectionTitle('Chiffres clés'),
        TwoColumns(children: [
          KpiTile(icon: LucideIcons.arrowDownLeft, color: AppColors.success, label: 'Entrées cumulées', value: stats.n('totalIn'), format: Fmt.fcfaCompact,
                  caption: stats.n('transfersIn') > 0 ? 'Dont ${Fmt.fcfaCompact(stats.n('transfersIn'))} de transferts' : null)
              .entrance(0),
          KpiTile(icon: LucideIcons.arrowUpRight, color: AppColors.danger, label: 'Sorties cumulées', value: stats.n('totalOut'), format: Fmt.fcfaCompact,
                  caption: '${stats.i('paidExpensesCount')} dépense(s) payée(s)')
              .entrance(1),
          KpiTile(icon: LucideIcons.users, color: AppColors.info, label: 'Donateurs identifiés', value: stats.n('donorsCount'), format: Fmt.number,
                  caption: '${stats.i('entriesCount')} don(s) reçu(s)')
              .entrance(2),
          KpiTile(icon: LucideIcons.gift, color: AppColors.violet, label: 'Don moyen', value: stats.n('averageGift'), format: Fmt.fcfaCompact,
                  caption: stats.n('committedExpenses') > 0 ? 'Engagé : ${Fmt.fcfaCompact(stats.n('committedExpenses'))}' : null)
              .entrance(3),
        ]),
        const SectionTitle('Mouvements sur 6 mois'),
        Gutter(
          child: AppCard(
            child: Column(children: [
              Row(children: const [
                _Dot(color: AppColors.success, label: 'Entrées'),
                SizedBox(width: 14),
                _Dot(color: AppColors.danger, label: 'Sorties'),
              ]),
              const SizedBox(height: 12),
              DualBarChart(points: monthly),
            ]),
          ),
        ),
        const SizedBox(height: 22),
        ChoiceChips<int>(
          options: [
            (0, 'Historique (${d.list('transactions').length})'),
            (1, 'Recettes (${d.list('revenues').length})'),
            (2, 'Dépenses (${d.list('expenses').length})'),
            (3, 'Donateurs'),
            (4, 'Infos'),
          ],
          selected: _tab,
          onChanged: (v) => setState(() => _tab = v),
        ),
        const SizedBox(height: 8),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          child: KeyedSubtree(
            key: ValueKey(_tab),
            child: switch (_tab) {
              0 => _History(items: d.list('transactions')),
              1 => _Revenues(items: d.list('revenues')),
              2 => _Expenses(items: d.list('expenses')),
              3 => _Donors(items: d.list('topDonors'), total: stats.n('revenues')),
              _ => _Infos(fund: fund, stats: stats, p: p),
            },
          ),
        ),
      ],
    );
  }

  Future<void> _toggleStatus(BuildContext context, Map<String, dynamic> fund, bool closed) async {
    if (closed && fund.s('endDate').isNotEmpty && fund.s('endDate').compareTo(Fmt.dayIso(DateTime.now())) < 0) {
      showToast(context, 'Délai dépassé', kind: ToastKind.info, detail: 'Modifiez la quête pour fixer une nouvelle date limite, elle sera rouverte.');
      return;
    }
    final ok = await confirmAction(
      context,
      title: closed ? 'Rouvrir la quête ?' : 'Clôturer la quête ?',
      message: closed
          ? 'La quête acceptera de nouveau des dons.'
          : 'Plus aucun don ne pourra lui être affecté. Le montant collecté reste dans la caisse, dans ce compartiment.',
      confirmLabel: closed ? 'Rouvrir' : 'Clôturer',
      icon: closed ? LucideIcons.lockOpen : LucideIcons.lock,
    );
    if (!ok || !context.mounted) return;
    try {
      await Api.updateFund(fund.s('id'), {'status': closed ? 'active' : 'closed'});
      if (!context.mounted) return;
      context.read<DataBus>().bump();
      showToast(context, closed ? 'Quête rouverte' : 'Quête clôturée');
    } on ApiException catch (e) {
      if (context.mounted) showToast(context, 'Action impossible', kind: ToastKind.error, detail: e.message);
    }
  }
}

class _Hero extends StatelessWidget {
  final Map<String, dynamic> fund;
  final Map<String, dynamic> stats;
  final Map<String, dynamic>? campaign;
  final FundStyle style;
  const _Hero({required this.fund, required this.stats, required this.campaign, required this.style});

  @override
  Widget build(BuildContext context) {
    final c = campaign;
    if (c == null) {
      return HeroCard(
        eyebrow: 'Solde du compartiment',
        icon: style.icon,
        value: stats.n('balance'),
        format: Fmt.fcfa,
        footer: Text('Entrées ${Fmt.fcfaCompact(stats.n('totalIn'))} • Sorties ${Fmt.fcfaCompact(stats.n('totalOut'))}',
            style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, fontSize: 13)),
      );
    }
    final (label, color, icon) = campaignStateStyle(c.s('state'));
    final daysLeft = c['daysLeft'];
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: style.color.withValues(alpha: 0.4)),
        boxShadow: [BoxShadow(color: style.color.withValues(alpha: 0.25), blurRadius: 40, offset: const Offset(0, 16))],
      ),
      child: Column(children: [
        Row(children: [
          StatusPill(label, color: color, icon: icon),
          const Spacer(),
          if (daysLeft != null && c.s('state') == 'active')
            Text(daysLeft == 0 ? 'Dernier jour' : '$daysLeft jour(s) restant(s)',
                style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w800, fontSize: 12.5)),
        ]),
        const SizedBox(height: 18),
        Row(children: [
          ProgressRing(
            value: c.n('percentage') / 100,
            size: 132,
            stroke: 13,
            color: c.s('state') == 'reached' ? AppColors.success : style.color,
            trackColor: Colors.white12,
            center: Column(mainAxisSize: MainAxisSize.min, children: [
              Text(Fmt.percent(c.n('percentage')), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
              const Text('atteint', style: TextStyle(color: Colors.white60, fontSize: 11.5, fontWeight: FontWeight.w700)),
            ]),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('COLLECTÉ', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
              AnimatedNumber(c.n('collected'), format: Fmt.fcfa,
                  style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
              const SizedBox(height: 10),
              const Text('OBJECTIF', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
              Text(Fmt.fcfa(c.n('target')), style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w900, fontSize: 15)),
              const SizedBox(height: 8),
              Text(
                c.n('remaining') > 0 ? 'Reste ${Fmt.fcfa(c.n('remaining'))}' : 'Objectif dépassé de ${Fmt.fcfa(c.n('collected') - c.n('target'))}',
                style: const TextStyle(color: Colors.white70, fontSize: 12.5, fontWeight: FontWeight.w600),
              ),
            ]),
          ),
        ]),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.07), borderRadius: BorderRadius.circular(16)),
          child: Row(children: [
            const Icon(LucideIcons.calendarRange, size: 16, color: Colors.white60),
            const SizedBox(width: 8),
            Expanded(
              child: Text('Du ${Fmt.date(fund.s('startDate'))} au ${Fmt.date(fund.s('endDate'))}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
            ),
            Text('Solde ${Fmt.fcfaCompact(stats.n('balance'))}', style: const TextStyle(color: Colors.white60, fontWeight: FontWeight.w700, fontSize: 12)),
          ]),
        ),
      ]),
    ).animate().fadeIn(duration: 500.ms).scaleXY(begin: 0.96, curve: Curves.easeOutCubic);
  }
}

class _History extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  const _History({required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const EmptyState(icon: LucideIcons.bookOpen, title: 'Aucune écriture', message: 'Les mouvements de ce compartiment apparaîtront ici.');
    }
    return Column(children: [
      for (final (i, t) in items.indexed)
        RowTile(
          icon: switch (t.s('type')) {
            'credit_entry' => LucideIcons.arrowDownLeft,
            'debit_expense' => LucideIcons.arrowUpRight,
            'transfer_in' => LucideIcons.arrowRightToLine,
            'transfer_out' => LucideIcons.arrowLeftFromLine,
            _ => LucideIcons.repeat,
          },
          color: t.s('direction') == 'credit' ? AppColors.success : AppColors.danger,
          title: t.s('description'),
          subtitle: '${t.s('number')} • ${Fmt.dateTime(t.s('date'))}\nSolde après : ${Fmt.fcfa(t.n('balanceAfter'))}',
          trailing: '${t.s('direction') == 'credit' ? '+' : '−'}${Fmt.fcfaCompact(t.n('amount'))}',
          trailingColor: t.s('direction') == 'credit' ? AppColors.success : AppColors.danger,
        ).entrance(i),
    ]);
  }
}

class _Revenues extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  const _Revenues({required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const EmptyState(icon: LucideIcons.handCoins, title: 'Aucune recette', message: 'Aucun don n\'a encore été affecté à ce compartiment.');
    }
    return Column(children: [
      for (final (i, r) in items.indexed)
        RowTile(
          icon: LucideIcons.handCoins,
          color: AppColors.success,
          title: r.s('donorName', 'Anonyme / Collecte'),
          subtitle: '${r.s('entryNumber')} • ${r.s('category')} • ${Fmt.date(r.s('collectedAt'))}'
              '${r.n('percentage') < 100 ? '\n${r.i('percentage')} % de ${Fmt.fcfa(r.n('grossAmount'))}' : ''}',
          trailing: '+${Fmt.fcfaCompact(r.n('amount'))}',
          trailingColor: AppColors.success,
        ).entrance(i),
    ]);
  }
}

class _Expenses extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  const _Expenses({required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const EmptyState(icon: LucideIcons.receipt, title: 'Aucune dépense', message: 'Aucune dépense n\'a été imputée à ce compartiment.');
    }
    return Column(children: [
      for (final (i, e) in items.indexed)
        Builder(builder: (context) {
          final st = StatusStyle.expense(e.s('status'));
          return RowTile(
            icon: st.icon,
            color: st.color,
            title: e.s('beneficiary', e.s('number')),
            subtitle: '${st.label} • ${Fmt.date(e.s('date'))}\n${e.s('purpose')}',
            trailing: '−${Fmt.fcfaCompact(e.n('amount'))}',
            trailingColor: e.s('status') == 'paid' ? AppColors.danger : null,
          ).entrance(i);
        }),
    ]);
  }
}

class _Donors extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final num total;
  const _Donors({required this.items, required this.total});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    if (items.isEmpty) {
      return const EmptyState(icon: LucideIcons.trophy, title: 'Aucun donateur', message: 'Le classement apparaîtra dès les premiers dons.');
    }
    const medals = [Color(0xFFFFC233), Color(0xFFC0C7D6), Color(0xFFD08A4E)];
    return Column(children: [
      for (final (i, d) in items.indexed)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
          child: AppCard(
            padding: const EdgeInsets.all(14),
            borderColor: i < 3 ? medals[i].withValues(alpha: 0.5) : null,
            child: Row(children: [
              Container(
                width: 40,
                height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: i < 3 ? LinearGradient(colors: [medals[i], medals[i].withValues(alpha: 0.6)]) : null,
                  color: i < 3 ? null : p.surfaceHigh,
                ),
                child: i < 3
                    ? const Icon(LucideIcons.trophy, size: 18, color: AppColors.navy)
                    : Text('${i + 1}', style: TextStyle(fontWeight: FontWeight.w900, color: p.textMuted)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(d.s('name'), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
                  Text('${d.i('count')} don(s) • dernier ${Fmt.date(d.s('lastAt'))}', style: TextStyle(color: p.textMuted, fontSize: 12)),
                  const SizedBox(height: 6),
                  ProgressBar(value: total > 0 ? d.n('total') / total : 0, color: i < 3 ? medals[i] : AppColors.info, height: 5),
                ]),
              ),
              const SizedBox(width: 12),
              Text(Fmt.fcfaCompact(d.n('total')), style: TextStyle(fontWeight: FontWeight.w900, color: p.text)),
            ]),
          ),
        ).entrance(i),
      Padding(
        padding: const EdgeInsets.fromLTRB(24, 10, 24, 0),
        child: Text('Montants affectés à ce compartiment. Pour une dîme, seule la part ventilée ici est comptée.',
            textAlign: TextAlign.center, style: TextStyle(color: p.textFaint, fontSize: 11.5)),
      ),
    ]);
  }
}

class _Infos extends StatelessWidget {
  final Map<String, dynamic> fund;
  final Map<String, dynamic> stats;
  final Palette p;
  const _Infos({required this.fund, required this.stats, required this.p});

  @override
  Widget build(BuildContext context) {
    Widget row(IconData icon, String k, String v) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, size: 17, color: p.textFaint),
            const SizedBox(width: 10),
            SizedBox(width: 120, child: Text(k, style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600))),
            Expanded(child: Text(v, textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.w800, color: p.text))),
          ]),
        );
    final campaign = fund.s('kind') == 'campaign';
    return Gutter(
      child: Column(children: [
        AppCard(
          child: Column(children: [
            row(LucideIcons.hash, 'Code', fund.s('code')),
            row(LucideIcons.layers, 'Type', campaign ? 'Quête spontanée (temporaire)' : 'Compartiment permanent'),
            row(LucideIcons.lock, 'Usage', fund.b('isRestricted') ? 'Affecté (réservé)' : 'Charges courantes'),
            if (fund.obj('revenueCategory').isNotEmpty) row(LucideIcons.tag, 'Catégorie de recette', fund.obj('revenueCategory').s('name')),
            if (campaign) row(LucideIcons.target, 'Objectif', Fmt.fcfa(fund.n('targetAmount'))),
            if (campaign) row(LucideIcons.calendarRange, 'Période', '${Fmt.date(fund.s('startDate'))} → ${Fmt.date(fund.s('endDate'))}'),
            row(LucideIcons.calendarPlus, 'Créé le', Fmt.date(fund.s('created'))),
            if (fund.s('createdBy').isNotEmpty) row(LucideIcons.userRound, 'Créé par', fund.s('createdBy')),
          ]),
        ),
        if (fund.s('description').isNotEmpty) ...[
          const SizedBox(height: 12),
          AppCard(child: Text(fund.s('description'), style: TextStyle(color: p.textMuted, height: 1.5))),
        ],
        if (stats.n('openingBalance') != 0) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.info.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(18)),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(LucideIcons.info, size: 18, color: AppColors.info),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Solde d\'ouverture : ${Fmt.fcfa(stats.n('openingBalance'))} figurent au solde sans écriture correspondante au grand livre '
                  '(report saisi directement). Une écriture d\'à-nouveau est recommandée.',
                  style: TextStyle(color: p.textMuted, fontSize: 12.5, height: 1.45),
                ),
              ),
            ]),
          ),
        ],
      ]),
    );
  }
}

class _Dot extends StatelessWidget {
  final Color color;
  final String label;
  const _Dot({required this.color, required this.label});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 9, height: 9, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: Palette.of(context).textMuted, fontWeight: FontWeight.w700, fontSize: 12)),
      ]);
}
