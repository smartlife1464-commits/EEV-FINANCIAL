import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/format.dart';
import '../../../core/models.dart';
import '../../../core/rules.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../../../state/data_bus.dart';
import 'fund_detail_screen.dart';
import 'fund_form_screen.dart';
import 'fund_style.dart';
import '../shell/home_shell.dart';
import 'expense_actions.dart';

/// Espace Finances : trésorerie, journal des recettes, suivi des dépenses.
class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  int _tab = 0;
  int _reload = 0;

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final version = context.watch<DataBus>().version;
    return Column(children: [
      SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Caisse unique consolidée', style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600, fontSize: 13)),
                Text('Finances', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: p.text, letterSpacing: -0.6)),
              ]),
            ),
            RoundIconButton(icon: LucideIcons.refreshCw, tooltip: 'Actualiser', onTap: () => setState(() => _reload++)),
          ]),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: _Segmented(
          labels: const ['Trésorerie', 'Recettes', 'Dépenses'],
          index: _tab,
          onChanged: (i) => setState(() => _tab = i),
        ),
      ),
      const SizedBox(height: 10),
      Expanded(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: KeyedSubtree(
            key: ValueKey('$_tab-$_reload-$version'),
            child: switch (_tab) {
              0 => const _TreasuryTab(),
              1 => const _EntriesTab(),
              _ => const _ExpensesTab(),
            },
          ),
        ),
      ),
    ]);
  }
}

class _Segmented extends StatelessWidget {
  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;
  const _Segmented({required this.labels, required this.index, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Container(
      height: 48,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: p.border)),
      child: LayoutBuilder(builder: (context, c) {
        final w = c.maxWidth / labels.length;
        return Stack(children: [
          AnimatedPositioned(
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeOutCubic,
            left: w * index,
            top: 0,
            bottom: 0,
            width: w,
            child: Container(decoration: BoxDecoration(gradient: AppColors.goldGradient, borderRadius: BorderRadius.circular(14))),
          ),
          Row(children: [
            for (var i = 0; i < labels.length; i++)
              Expanded(
                child: Pressable(
                  onTap: () => onChanged(i),
                  child: Center(
                    child: AnimatedDefaultTextStyle(
                      duration: const Duration(milliseconds: 250),
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13.5,
                        color: i == index ? AppColors.navy : p.textMuted,
                        fontFamily: DefaultTextStyle.of(context).style.fontFamily,
                      ),
                      child: Text(labels[i]),
                    ),
                  ),
                ),
              ),
          ]),
        ]);
      }),
    );
  }
}

// ------------------------------------------------------------------ Trésorerie
class _TreasuryTab extends StatelessWidget {
  const _TreasuryTab();

  void _create(BuildContext context) {
    showAppSheet<void>(context, builder: (ctx) {
      final p = Palette.of(ctx);
      Widget option(IconData icon, Color color, String title, String subtitle, String kind) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              padding: const EdgeInsets.all(14),
              onTap: () {
                Navigator.pop(ctx);
                pushPage(context, FundFormScreen(initialKind: kind));
              },
              child: Row(children: [
                IconChip(icon, color: color, size: 48),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(title, style: TextStyle(fontWeight: FontWeight.w800, color: p.text, fontSize: 15.5)),
                    Text(subtitle, style: TextStyle(color: p.textMuted, fontSize: 12.5)),
                  ]),
                ),
                Icon(LucideIcons.chevronRight, color: p.textFaint),
              ]),
            ),
          );
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('Ajouter à la caisse', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: p.text)),
          const SizedBox(height: 14),
          option(LucideIcons.target, const Color(0xFFF97316), 'Quête spontanée', 'Temporaire : somme à atteindre et délai', 'campaign'),
          option(LucideIcons.piggyBank, AppColors.cyan, 'Compartiment de caisse', 'Fonds durable (ministère, projet, département)', 'permanent'),
        ]),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<Session>().user!;
    return Loader<Map<String, dynamic>>(
      load: Api.treasury,
      builder: (context, t, reload) {
        final p = Palette.of(context);
        final all = t.list('funds');
        final campaigns = all.where((f) => f.obj('account').s('kind') == 'campaign').toList();
        final running = campaigns.where((f) => f.obj('account').s('status') != 'closed').toList();
        final ended = campaigns.where((f) => f.obj('account').s('status') == 'closed').toList();
        final permanent = all.where((f) => f.obj('account').s('kind') != 'campaign').toList();
        void open(Map<String, dynamic> f) => pushPage(context, FundDetailScreen(fundId: f.obj('account').s('id')));

        return RefreshIndicator(
          onRefresh: reload,
          color: AppColors.navy,
          backgroundColor: AppColors.gold,
          child: ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.only(top: 8), children: [
            HeroCard(
              eyebrow: 'Solde physique consolidé',
              value: t.n('consolidatedPhysicalBalance'),
              format: Fmt.fcfa,
              icon: LucideIcons.vault,
              footer: Text(
                'Fonds Général libre : ${Fmt.fcfa(t.n('generalFundFreeBalance'))}\nEngagements en attente : ${Fmt.fcfa(t.n('pendingCommitmentsTotal'))}',
                style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, height: 1.5, fontSize: 13),
              ),
            ),
            if (user.canManageFunds)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: SecondaryButton(
                  label: 'Ajouter un compartiment ou une quête',
                  icon: LucideIcons.plus,
                  color: AppColors.gold,
                  onPressed: () => _create(context),
                ),
              ),
            SectionTitle(running.isEmpty ? 'Quêtes spontanées' : 'Quêtes en cours (${running.length})'),
            if (running.isEmpty)
              Gutter(
                child: AppCard(
                  onTap: user.canManageFunds ? () => pushPage(context, const FundFormScreen()) : null,
                  child: Row(children: [
                    const IconChip(LucideIcons.target, color: Color(0xFFF97316), size: 46),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        user.canManageFunds
                            ? 'Aucune quête en cours. Lancez une collecte avec un objectif et une date limite.'
                            : 'Aucune quête en cours pour le moment.',
                        style: TextStyle(color: p.textMuted, height: 1.4),
                      ),
                    ),
                  ]),
                ),
              ),
            for (final (i, f) in running.indexed) _CampaignTile(fund: f, onTap: () => open(f)).entrance(i),
            const SectionTitle('Compartiments analytiques'),
            for (final (i, f) in permanent.indexed)
              Builder(builder: (context) {
                final style = FundStyle.ofTreasury(f);
                final a = f.obj('account');
                return Gutter(
                  vertical: 5,
                  child: AppCard(
                    onTap: () => open(f),
                    padding: const EdgeInsets.all(16),
                    child: Column(children: [
                      Row(children: [
                        IconChip(style.icon, color: style.color, size: 42),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(a.s('name'), style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
                            Text(a.b('isRestricted') ? 'Fonds affecté • usage réservé' : 'Charges courantes',
                                style: TextStyle(color: p.textMuted, fontSize: 12)),
                          ]),
                        ),
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text(Fmt.fcfaCompact(f.n('balance')), style: TextStyle(fontWeight: FontWeight.w900, color: p.text, fontSize: 16)),
                          Text(Fmt.percent(f.n('percentageOfTotal')), style: TextStyle(color: p.textFaint, fontSize: 12, fontWeight: FontWeight.w700)),
                        ]),
                        const SizedBox(width: 6),
                        Icon(LucideIcons.chevronRight, size: 18, color: p.textFaint),
                      ]),
                      const SizedBox(height: 12),
                      ProgressBar(value: f.n('percentageOfTotal') / 100, color: style.color),
                    ]),
                  ),
                ).entrance(i);
              }),
            if (ended.isNotEmpty) ...[
              SectionTitle('Quêtes clôturées (${ended.length})'),
              for (final (i, f) in ended.indexed) Opacity(opacity: 0.75, child: _CampaignTile(fund: f, onTap: () => open(f))).entrance(i),
            ],
            const SizedBox(height: 130),
          ]),
        );
      },
    );
  }
}

/// Carte d'une quête : anneau de progression, montant collecté, délai restant
class _CampaignTile extends StatelessWidget {
  final Map<String, dynamic> fund;
  final VoidCallback onTap;
  const _CampaignTile({required this.fund, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final a = fund.obj('account');
    final c = fund.obj('campaign');
    final style = FundStyle.ofTreasury(fund);
    final (label, stateColor, stateIcon) = campaignStateStyle(c.s('state'));
    final daysLeft = c['daysLeft'];
    return Gutter(
      vertical: 5,
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(16),
        borderColor: style.color.withValues(alpha: 0.35),
        child: Row(children: [
          ProgressRing(
            value: c.n('percentage') / 100,
            size: 68,
            stroke: 8,
            color: c.s('state') == 'reached' ? AppColors.success : style.color,
            center: Text('${c.n('percentage').round()}%', style: TextStyle(fontWeight: FontWeight.w900, color: p.text, fontSize: 14)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(a.s('name'), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w900, color: p.text, fontSize: 15)),
              const SizedBox(height: 3),
              Text('${Fmt.fcfa(c.n('collected'))} sur ${Fmt.fcfaCompact(c.n('target'))}',
                  style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w600, fontSize: 12.5)),
              const SizedBox(height: 8),
              Row(children: [
                StatusPill(label, color: stateColor, icon: stateIcon),
                const SizedBox(width: 8),
                if (daysLeft != null && c.s('state') == 'active')
                  Text(daysLeft == 0 ? 'Dernier jour' : 'J-$daysLeft', style: TextStyle(color: p.textFaint, fontWeight: FontWeight.w800, fontSize: 12)),
              ]),
            ]),
          ),
          Icon(LucideIcons.chevronRight, size: 18, color: p.textFaint),
        ]),
      ),
    );
  }
}

// ------------------------------------------------------------------ Recettes
class _EntriesTab extends StatefulWidget {
  const _EntriesTab();
  @override
  State<_EntriesTab> createState() => _EntriesTabState();
}

class _EntriesTabState extends State<_EntriesTab> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    return Loader<List<Map<String, dynamic>>>(
      load: Api.entries,
      builder: (context, entries, reload) {
        final p = Palette.of(context);
        final q = _query.toLowerCase();
        final list = entries
            .where((e) => q.isEmpty || '${e.s('entry_number')} ${e.s('donor_name')} ${e.rel('category').s('name')} ${e.s('reference')}'.toLowerCase().contains(q))
            .toList();
        final total = list.fold<num>(0, (s, e) => s + e.n('amount'));
        return RefreshIndicator(
          onRefresh: reload,
          color: AppColors.navy,
          backgroundColor: AppColors.gold,
          child: ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.only(top: 6), children: [
            _SearchBar(hint: 'Rechercher un donateur, un numéro…', onChanged: (v) => setState(() => _query = v)),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 4, 22, 6),
              child: Text('${list.length} recette(s) • ${Fmt.fcfa(total)}', style: TextStyle(color: p.textMuted, fontWeight: FontWeight.w700, fontSize: 12.5)),
            ),
            if (list.isEmpty)
              const EmptyState(icon: LucideIcons.handCoins, title: 'Aucune recette', message: 'Les encaissements enregistrés apparaîtront ici.'),
            for (final (i, e) in list.indexed)
              RowTile(
                icon: e.rel('category').s('allocation_rule') == BusinessRules.standardSplit ? LucideIcons.handCoins : LucideIcons.gift,
                color: AppColors.success,
                title: e.rel('category').s('name', 'Recette'),
                subtitle: '${e.s('donor_name', 'Collecte')} • ${Fmt.date(e.s('collected_at'))}',
                trailing: '+${Fmt.fcfaCompact(e.n('amount'))}',
                trailingColor: AppColors.success,
                onTap: () => _showEntry(context, e),
              ).entrance(i),
            const SizedBox(height: 130),
          ]),
        );
      },
    );
  }

  void _showEntry(BuildContext context, Map<String, dynamic> e) {
    final cat = e.rel('category');
    final split = BusinessRules.allocate(e.i('amount'), cat.s('allocation_rule'),
        targetFundCode: cat.rel('target_fund').s('code'), targetFundName: cat.rel('target_fund').s('name'));
    showAppSheet<void>(context, builder: (ctx) {
      final p = Palette.of(ctx);
      return Padding(
        padding: const EdgeInsets.fromLTRB(22, 16, 22, 22),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const StatusPill('Encaissée', color: AppColors.success, icon: LucideIcons.circleCheck),
            const Spacer(),
            Text(e.s('entry_number'), style: TextStyle(color: p.textFaint, fontWeight: FontWeight.w800, fontSize: 12)),
          ]),
          const SizedBox(height: 14),
          Text(Fmt.fcfa(e.n('amount')), style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: p.text, letterSpacing: -1)),
          Text('${cat.s('name')} • ${Fmt.date(e.s('collected_at'))}', style: TextStyle(color: p.textMuted)),
          const SizedBox(height: 16),
          AppCard(
            padding: const EdgeInsets.all(14),
            child: Column(children: [
              LegendRow(color: AppColors.gold, label: 'Donateur', value: e.s('donor_name', 'Collecte')),
              LegendRow(color: AppColors.info, label: 'Règlement', value: paymentMethods[e.s('payment_method')]?.$1 ?? e.s('payment_method')),
              if (e.s('reference').isNotEmpty) LegendRow(color: AppColors.violet, label: 'Référence', value: e.s('reference')),
            ]),
          ),
          const SizedBox(height: 16),
          Text('Ventilation analytique', style: TextStyle(fontWeight: FontWeight.w800, color: p.text)),
          const SizedBox(height: 8),
          for (final (i, a) in split.indexed) LegendRow(color: AppColors.chart[i % 8], label: '${a.label} (${a.percentage} %)', value: Fmt.fcfa(a.amount)),
        ]),
      );
    });
  }
}

// ------------------------------------------------------------------ Dépenses
class _ExpensesTab extends StatefulWidget {
  const _ExpensesTab();
  @override
  State<_ExpensesTab> createState() => _ExpensesTabState();
}

class _ExpensesTabState extends State<_ExpensesTab> {
  String _status = 'all';
  int _reload = 0;

  @override
  Widget build(BuildContext context) {
    final user = context.read<Session>().user!;
    return Loader<List<Map<String, dynamic>>>(
      reloadKey: _reload,
      load: Api.expenses,
      builder: (context, expenses, reload) {
        final p = Palette.of(context);
        final list = expenses.where((e) => _status == 'all' || e.s('status') == _status).toList();
        final counts = <String, int>{};
        for (final e in expenses) {
          counts[e.s('status')] = (counts[e.s('status')] ?? 0) + 1;
        }
        return RefreshIndicator(
          onRefresh: reload,
          color: AppColors.navy,
          backgroundColor: AppColors.gold,
          child: ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.only(top: 6), children: [
            ChoiceChips<String>(
              options: [
                ('all', 'Toutes (${expenses.length})'),
                ('pending_approval', 'En attente (${counts['pending_approval'] ?? 0})'),
                ('approved', 'À payer (${counts['approved'] ?? 0})'),
                ('paid', 'Payées (${counts['paid'] ?? 0})'),
                ('rejected', 'Rejetées (${counts['rejected'] ?? 0})'),
              ],
              selected: _status,
              onChanged: (v) => setState(() => _status = v),
            ),
            const SizedBox(height: 8),
            if (list.isEmpty)
              const EmptyState(icon: LucideIcons.receipt, title: 'Aucune dépense', message: 'Aucune dépense ne correspond à ce filtre.'),
            for (final (i, e) in list.indexed)
              Builder(builder: (context) {
                final st = StatusStyle.expense(e.s('status'));
                final actionable = (user.permissions.approveExpense && e.s('status') == 'pending_approval' && e.rel('requested_by')['id'] != user.id) ||
                    (user.permissions.payExpense && e.s('status') == 'approved');
                return RowTile(
                  icon: st.icon,
                  color: st.color,
                  highlighted: actionable,
                  title: e.s('beneficiary', e.s('expense_number')),
                  subtitle: '${st.label} • ${Fmt.date(e.s('created'))}\n${e.s('purpose')}',
                  trailing: '−${Fmt.fcfaCompact(e.n('amount'))}',
                  trailingColor: e.s('status') == 'paid' ? AppColors.danger : p.text,
                  onTap: () async {
                    if (await showExpenseSheet(context, e)) setState(() => _reload++);
                  },
                ).entrance(i);
              }),
            const SizedBox(height: 130),
          ]),
        );
      },
    );
  }
}

class _SearchBar extends StatelessWidget {
  final String hint;
  final ValueChanged<String> onChanged;
  const _SearchBar({required this.hint, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: TextField(
        onChanged: onChanged,
        style: TextStyle(fontWeight: FontWeight.w600, color: p.text),
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(LucideIcons.search, size: 19, color: p.textMuted),
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }
}
