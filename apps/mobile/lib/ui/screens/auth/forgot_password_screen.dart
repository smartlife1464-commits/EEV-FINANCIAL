import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/api.dart';
import '../../kit/kit.dart';

/// Réinitialisation du mot de passe en 3 étapes : email → code à 6 chiffres → nouveau mot de passe.
class ForgotPasswordScreen extends StatefulWidget {
  final String initialEmail;
  const ForgotPasswordScreen({super.key, this.initialEmail = ''});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  late final _email = TextEditingController(text: widget.initialEmail);
  final _otp = TextEditingController();
  final _pass = TextEditingController();
  final _confirm = TextEditingController();
  int _step = 0;
  bool _loading = false;
  String? _error;
  String? _devOtp;
  String _resetToken = '';
  bool _obscure = true;

  @override
  void dispose() {
    for (final c in [_email, _otp, _pass, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await action();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _requestCode() => _run(() async {
        if (!_email.text.contains('@')) throw const ApiException('Saisissez une adresse email valide.');
        final r = await Api.requestPasswordReset(_email.text.trim().toLowerCase());
        _devOtp = kDebugMode ? r['devOtp']?.toString() : null;
        setState(() => _step = 1);
      });

  Future<void> _verify() => _run(() async {
        if (_otp.text.length != 6) throw const ApiException('Le code comporte 6 chiffres.');
        final r = await Api.verifyOtp(_email.text.trim().toLowerCase(), _otp.text);
        _resetToken = r['resetToken']?.toString() ?? '';
        setState(() => _step = 2);
      });

  Future<void> _reset() => _run(() async {
        if (_pass.text.length < 8) throw const ApiException('Le mot de passe doit contenir au moins 8 caractères.');
        if (_pass.text != _confirm.text) throw const ApiException('Les deux mots de passe ne correspondent pas.');
        await Api.resetPassword(_email.text.trim().toLowerCase(), _resetToken, _pass.text);
        if (!mounted) return;
        showToast(context, 'Mot de passe modifié', detail: 'Vous pouvez vous connecter avec votre nouveau mot de passe.');
        Navigator.of(context).pop();
      });

  @override
  Widget build(BuildContext context) {
    final steps = [
      ('Mot de passe oublié', 'Indiquez l\'email de votre compte : nous vous envoyons un code de vérification.', LucideIcons.mail),
      ('Code de vérification', 'Saisissez le code à 6 chiffres reçu pour ${_email.text}.', LucideIcons.shieldCheck),
      ('Nouveau mot de passe', 'Choisissez un mot de passe robuste d\'au moins 8 caractères.', LucideIcons.keyRound),
    ];
    final (title, body, icon) = steps[_step];

    return Theme(
      data: AppTheme.dark(),
      child: Scaffold(
        backgroundColor: AppColors.darkBg,
        body: AuroraBackground(
          intense: true,
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Row(children: [
                  RoundIconButton(icon: LucideIcons.arrowLeft, onTap: () => _step == 0 ? Navigator.pop(context) : setState(() => _step--)),
                  const Spacer(),
                  for (var i = 0; i < 3; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.only(left: 6),
                      width: i == _step ? 26 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: i <= _step ? AppColors.gold : Colors.white24,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                ]),
                const SizedBox(height: 40),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 380),
                  transitionBuilder: (c, a) => FadeTransition(
                    opacity: a,
                    child: SlideTransition(position: Tween(begin: const Offset(0.08, 0), end: Offset.zero).animate(a), child: c),
                  ),
                  child: Column(
                    key: ValueKey(_step),
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      IconChip(icon, color: AppColors.gold, size: 64),
                      const SizedBox(height: 22),
                      Text(title, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -0.6)),
                      const SizedBox(height: 8),
                      Text(body, style: const TextStyle(color: Colors.white60, height: 1.5)),
                      const SizedBox(height: 28),
                      if (_step == 0)
                        AppField(controller: _email, label: 'Adresse email', icon: LucideIcons.mail, keyboardType: TextInputType.emailAddress),
                      if (_step == 1) ...[
                        _OtpInput(controller: _otp, onCompleted: _verify),
                        if (_devOtp != null) ...[
                          const SizedBox(height: 12),
                          Text('Code (développement) : $_devOtp', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                        ],
                        TextButton(
                          onPressed: _loading ? null : _requestCode,
                          child: const Text('Renvoyer le code', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.w700)),
                        ),
                      ],
                      if (_step == 2) ...[
                        AppField(
                          controller: _pass,
                          label: 'Nouveau mot de passe',
                          icon: LucideIcons.lockKeyhole,
                          obscure: _obscure,
                          suffix: IconButton(
                            icon: Icon(_obscure ? LucideIcons.eye : LucideIcons.eyeOff, size: 19),
                            onPressed: () => setState(() => _obscure = !_obscure),
                          ),
                        ),
                        const SizedBox(height: 14),
                        AppField(controller: _confirm, label: 'Confirmation', icon: LucideIcons.lockKeyhole, obscure: _obscure),
                      ],
                    ],
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Text(_error!, style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w700))
                        .animate()
                        .shake(hz: 3, offset: const Offset(3, 0)),
                  ),
                const SizedBox(height: 26),
                PrimaryButton(
                  label: ['Recevoir le code', 'Vérifier', 'Enregistrer'][_step],
                  icon: [LucideIcons.send, LucideIcons.shieldCheck, LucideIcons.check][_step],
                  loading: _loading,
                  onPressed: [_requestCode, _verify, _reset][_step],
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// Saisie du code à 6 chiffres sous forme de cases
class _OtpInput extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onCompleted;
  const _OtpInput({required this.controller, required this.onCompleted});

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      ValueListenableBuilder<TextEditingValue>(
        valueListenable: controller,
        builder: (context, v, _) => Row(
          children: [
            for (var i = 0; i < 6; i++)
              Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  height: 62,
                  margin: EdgeInsets.only(right: i < 5 ? 8 : 0),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: i == v.text.length ? AppColors.gold : Colors.white12, width: i == v.text.length ? 1.6 : 1),
                  ),
                  child: Text(i < v.text.length ? v.text[i] : '',
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
                ),
              ),
          ],
        ),
      ),
      Positioned.fill(
        child: Opacity(
          opacity: 0,
          child: TextField(
            controller: controller,
            autofocus: true,
            keyboardType: TextInputType.number,
            maxLength: 6,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            onChanged: (v) {
              if (v.length == 6) onCompleted();
            },
          ),
        ),
      ),
    ]);
  }
}
