import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../state/platform.dart';
import '../../kit/kit.dart';
import '../profile/server_sheet.dart';

/// Serveur pas encore configuré : l'installation se fait depuis l'application web
/// (assistant de première installation, réservé à l'administrateur de la plateforme).
class SetupRequiredScreen extends StatelessWidget {
  const SetupRequiredScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(brightness: Brightness.dark),
      child: Scaffold(
        backgroundColor: AppColors.darkBg,
        body: AuroraBackground(
          child: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(28),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const BrandLogo(size: 84, glow: true),
                  const SizedBox(height: 26),
                  const Text('Installation à finaliser',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 10),
                  const Text(
                    'Ce serveur n’est pas encore configuré. L’administrateur de la plateforme doit d’abord ouvrir '
                    'l’application web pour créer son compte et paramétrer l’église. Vous pourrez ensuite vous connecter ici.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white60, height: 1.5),
                  ),
                  const SizedBox(height: 28),
                  PrimaryButton(
                    label: 'Vérifier à nouveau',
                    icon: LucideIcons.refreshCw,
                    onPressed: () => context.read<PlatformState>().load(),
                  ),
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: () => showServerSheet(context),
                    icon: const Icon(LucideIcons.serverCog, size: 16, color: Colors.white54),
                    label: const Text('Configuration du serveur', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.w600)),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
