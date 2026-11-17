import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../state/platform.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/api.dart';
import '../../../data/storage.dart';
import '../../../state/session.dart';
import '../../kit/kit.dart';
import '../profile/server_sheet.dart';
import 'forgot_password_screen.dart';

/// Connexion : univers bleu nuit immersif, formulaire en verre dépoli.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    Storage.lastEmail().then((v) {
      if (v != null && mounted && _email.text.isEmpty) _email.text = v;
    });
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<Session>().signIn(_email.text, _password.text);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    return Theme(
      data: AppTheme.dark(),
      child: Builder(builder: (context) {
        return Scaffold(
          backgroundColor: AppColors.darkBg,
          resizeToAvoidBottomInset: true,
          body: AuroraBackground(
            intense: true,
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(22, 20, 22, 24),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      const Center(child: BrandLogo(size: 84, glow: true))
                          .animate()
                          .scale(duration: 700.ms, curve: Curves.easeOutBack),
                      const SizedBox(height: 24),
                      const Text('Bienvenue', textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -0.8))
                          .animate()
                          .fadeIn(delay: 150.ms)
                          .slideY(begin: 0.3),
                      const SizedBox(height: 6),
                      Text('Connectez-vous à l\'espace de gestion\n${context.watch<PlatformState>().config.name}',
                              textAlign: TextAlign.center, style: const TextStyle(color: Colors.white60, height: 1.45))
                          .animate()
                          .fadeIn(delay: 250.ms),
                      const SizedBox(height: 28),
                      if (session.expiredNotice)
                        _Banner(
                          icon: LucideIcons.clock,
                          color: AppColors.warning,
                          text: 'Votre session a expiré. Merci de vous reconnecter.',
                        ),
                      Glass(
                        radius: 30,
                        padding: const EdgeInsets.all(22),
                        child: Form(
                          key: _form,
                          child: AutofillGroup(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                              AppField(
                                controller: _email,
                                label: 'Adresse email',
                                hint: 'prenom.nom@exemple.org',
                                icon: LucideIcons.mail,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                autofillHints: const [AutofillHints.email],
                                validator: (v) => (v == null || !v.contains('@')) ? 'Adresse email invalide' : null,
                              ),
                              const SizedBox(height: 16),
                              AppField(
                                controller: _password,
                                label: 'Mot de passe',
                                hint: '••••••••',
                                icon: LucideIcons.lockKeyhole,
                                obscure: _obscure,
                                textInputAction: TextInputAction.done,
                                autofillHints: const [AutofillHints.password],
                                onSubmitted: (_) => _submit(),
                                validator: (v) => (v == null || v.length < 8) ? '8 caractères minimum' : null,
                                suffix: IconButton(
                                  tooltip: _obscure ? 'Afficher' : 'Masquer',
                                  icon: Icon(_obscure ? LucideIcons.eye : LucideIcons.eyeOff, size: 19),
                                  onPressed: () => setState(() => _obscure = !_obscure),
                                ),
                              ),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                                    builder: (_) => ForgotPasswordScreen(initialEmail: _email.text),
                                  )),
                                  child: const Text('Mot de passe oublié ?',
                                      style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.w700)),
                                ),
                              ),
                              AnimatedSize(
                                duration: const Duration(milliseconds: 250),
                                child: _error == null
                                    ? const SizedBox.shrink()
                                    : Padding(
                                        padding: const EdgeInsets.only(bottom: 14),
                                        child: _Banner(icon: LucideIcons.circleAlert, color: AppColors.danger, text: _error!),
                                      ),
                              ),
                              PrimaryButton(
                                label: 'Se connecter',
                                icon: LucideIcons.arrowRight,
                                loading: _loading,
                                onPressed: _submit,
                              ),
                            ]),
                          ),
                        ),
                      ).animate().fadeIn(delay: 300.ms, duration: 500.ms).slideY(begin: 0.08, curve: Curves.easeOutCubic),
                      const SizedBox(height: 22),
                      Center(
                        child: TextButton.icon(
                          onPressed: () => showServerSheet(context),
                          icon: const Icon(LucideIcons.serverCog, size: 16, color: Colors.white38),
                          label: const Text('Configuration du serveur', style: TextStyle(color: Colors.white38, fontWeight: FontWeight.w600)),
                        ),
                      ),
                      const Text(
                        '« Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur. » — Col 3:23',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white24, fontSize: 11.5, fontStyle: FontStyle.italic),
                      ),
                    ]),
                  ),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}

class _Banner extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String text;
  const _Banner({required this.icon, required this.color, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13))),
      ]),
    ).animate().fadeIn().shake(hz: 3, offset: const Offset(3, 0), duration: 350.ms);
  }
}
