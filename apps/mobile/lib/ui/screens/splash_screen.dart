import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../kit/kit.dart';
import 'package:provider/provider.dart';
import '../../state/platform.dart';

/// Écran de démarrage : logo en apesanteur, halo doré pulsé, nom de l'église.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(brightness: Brightness.dark),
      child: Scaffold(
        backgroundColor: AppColors.darkBg,
        body: AuroraBackground(
          intense: true,
          child: Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const BrandLogo(size: 116, glow: true)
                  .animate()
                  .scale(begin: const Offset(0.6, 0.6), duration: 900.ms, curve: Curves.easeOutBack)
                  .fadeIn(duration: 500.ms)
                  .then()
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .moveY(begin: 0, end: -8, duration: 1600.ms, curve: Curves.easeInOut),
              const SizedBox(height: 32),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  context.watch<PlatformState>().config.displayName.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 4),
                ),
              ).animate().fadeIn(delay: 350.ms, duration: 600.ms).slideY(begin: 0.4, curve: Curves.easeOutCubic),
              const SizedBox(height: 8),
              Text(
                'GOUVERNANCE • TRÉSORERIE • FRÉQUENTATION',
                style: TextStyle(color: AppColors.gold.withValues(alpha: 0.9), fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 2),
              ).animate().fadeIn(delay: 650.ms, duration: 600.ms),
              const SizedBox(height: 46),
              SizedBox(
                width: 140,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: const LinearProgressIndicator(minHeight: 3, backgroundColor: Color(0x22FFFFFF), color: AppColors.gold),
                ),
              ).animate().fadeIn(delay: 900.ms),
            ]),
          ),
        ),
      ),
    );
  }
}
