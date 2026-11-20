import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../state/platform.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/api.dart';
import '../../../data/storage.dart';
import '../../kit/kit.dart';

/// Réglage de l'adresse du serveur API (téléphone réel sur le réseau local, serveur de production…).
Future<void> showServerSheet(BuildContext context) async {
  final ctrl = TextEditingController(text: await Storage.apiUrl());
  if (!context.mounted) return;
  await showAppSheet<void>(context, builder: (ctx) => _ServerSheet(ctrl: ctrl));
}

class _ServerSheet extends StatefulWidget {
  final TextEditingController ctrl;
  const _ServerSheet({required this.ctrl});

  @override
  State<_ServerSheet> createState() => _ServerSheetState();
}

class _ServerSheetState extends State<_ServerSheet> {
  bool? _ok;
  bool _testing = false;

  Future<void> _test() async {
    setState(() {
      _testing = true;
      _ok = null;
    });
    final ok = await Api.ping(widget.ctrl.text.trim());
    if (mounted) {
      setState(() {
        _testing = false;
        _ok = ok;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          const IconChip(LucideIcons.serverCog, color: AppColors.gold),
          const SizedBox(width: 12),
          Expanded(
            child: Text('Serveur de l\'application', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: p.text)),
          ),
        ]),
        const SizedBox(height: 8),
        Text('Adresse de l\'API EEV. Sur un téléphone réel, utilisez l\'adresse IP de l\'ordinateur ou le domaine de production.',
            style: TextStyle(color: p.textMuted, height: 1.45, fontSize: 13)),
        const SizedBox(height: 16),
        AppField(controller: widget.ctrl, label: 'URL de l\'API', hint: 'https://…/api', icon: LucideIcons.link, keyboardType: TextInputType.url),
        const SizedBox(height: 12),
        if (_ok != null)
          StatusPill(
            _ok! ? 'Serveur joignable' : 'Serveur injoignable',
            color: _ok! ? AppColors.success : AppColors.danger,
            icon: _ok! ? LucideIcons.circleCheck : LucideIcons.circleX,
          ),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: SecondaryButton(label: _testing ? 'Test…' : 'Tester', icon: LucideIcons.activity, onPressed: _testing ? null : _test)),
          const SizedBox(width: 10),
          Expanded(
            child: SecondaryButton(
              label: 'Par défaut',
              icon: LucideIcons.rotateCcw,
              onPressed: () => setState(() => widget.ctrl.text = Storage.defaultApiUrl),
            ),
          ),
        ]),
        const SizedBox(height: 10),
        PrimaryButton(
          label: 'Enregistrer',
          icon: LucideIcons.check,
          onPressed: () async {
            await Storage.setApiUrl(widget.ctrl.text);
            if (context.mounted) {
              // Nouveau serveur = autre église possible : configuration rechargée
              context.read<PlatformState>().load();
              Navigator.pop(context);
              showToast(context, 'Adresse du serveur enregistrée');
            }
          },
        ),
      ]),
    );
  }
}
