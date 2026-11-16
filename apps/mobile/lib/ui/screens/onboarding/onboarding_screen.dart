import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme/app_colors.dart';
import '../../kit/kit.dart';

class _Slide {
  final IconData icon;
  final Color color;
  final String eyebrow;
  final String title;
  final String body;
  final List<(IconData, String)> points;
  const _Slide(
    this.icon,
    this.color,
    this.eyebrow,
    this.title,
    this.body,
    this.points,
  );
}

const _slides = [
  _Slide(
    LucideIcons.landmark,
    AppColors.gold,
    'TRÉSORERIE UNIQUE',
    'Chaque franc, tracé et ventilé',
    'Les dîmes et offrandes sont réparties automatiquement 80 / 10 / 10. Les dons affectés vont à 100 % à leur fonds.',
    [
      (LucideIcons.chartPie, 'Ventilation calculée en direct'),
      (LucideIcons.bookOpenCheck, 'Grand livre immuable'),
    ],
  ),
  _Slide(
    LucideIcons.church,
    AppColors.info,
    'FRÉQUENTATION',
    'Le pouls de chaque culte',
    'Saisissez une fiche en quelques secondes, même sans réseau. Le Responsable Protocole valide, le Pasteur suit l\'évolution.',
    [
      (LucideIcons.usersRound, 'Hommes, femmes, jeunes, enfants'),
      (LucideIcons.cloudUpload, 'Synchronisation hors-ligne'),
    ],
  ),
  _Slide(
    LucideIcons.shieldCheck,
    AppColors.success,
    'GOUVERNANCE',
    'Décider, en toute sérénité',
    'Aucune dépense n\'est payée sans l\'accord du Leader. Chaque action est horodatée et attribuée à son auteur.',
    [
      (LucideIcons.badgeCheck, 'Approbation en un geste'),
      (LucideIcons.bellRing, 'Alertes intelligentes'),
    ],
  ),
];

/// Présentation en trois écrans immersifs (affichée au premier lancement).
class OnboardingScreen extends StatefulWidget {
  final VoidCallback onDone;
  const OnboardingScreen({super.key, required this.onDone});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _ctrl = PageController();
  int _page = 0;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _next() {
    if (_page == _slides.length - 1) {
      widget.onDone();
    } else {
      _ctrl.nextPage(
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final slide = _slides[_page];
    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: AuroraBackground(
        intense: true,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 12, 16, 0),
                child: Row(
                  children: [
                    const BrandLogo(size: 40),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Esprit & Vie',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: widget.onDone,
                      child: const Text(
                        'Passer',
                        style: TextStyle(
                          color: Colors.white70,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _ctrl,
                  itemCount: _slides.length,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemBuilder: (context, i) =>
                      _SlideView(slide: _slides[i], key: ValueKey(i)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: Row(
                  children: [
                    for (var i = 0; i < _slides.length; i++)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.only(right: 6),
                        width: i == _page ? 28 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: i == _page ? slide.color : Colors.white24,
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    const Spacer(),
                    SizedBox(
                      width: 170,
                      child: PrimaryButton(
                        label: _page == _slides.length - 1
                            ? 'Commencer'
                            : 'Suivant',
                        icon: LucideIcons.arrowRight,
                        onPressed: _next,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SlideView extends StatelessWidget {
  final _Slide slide;
  const _SlideView({super.key, required this.slide});

  @override
  Widget build(BuildContext context) {
    // Défilement de secours sur les petits écrans (aucun débordement quelle que soit la hauteur)
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxHeight < 640;
        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                            width: compact ? 170 : 230,
                            height: compact ? 170 : 230,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  slide.color.withValues(alpha: 0.35),
                                  slide.color.withValues(alpha: 0),
                                ],
                              ),
                            ),
                          )
                          .animate(onPlay: (c) => c.repeat(reverse: true))
                          .scaleXY(
                            begin: 0.9,
                            end: 1.08,
                            duration: 2400.ms,
                            curve: Curves.easeInOut,
                          ),
                      Container(
                            width: compact ? 104 : 128,
                            height: compact ? 104 : 128,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(40),
                              border: Border.all(
                                color: slide.color.withValues(alpha: 0.5),
                                width: 1.5,
                              ),
                            ),
                            child: Icon(
                              slide.icon,
                              size: 56,
                              color: slide.color,
                            ),
                          )
                          .animate()
                          .scale(duration: 700.ms, curve: Curves.easeOutBack)
                          .rotate(begin: -0.05, duration: 700.ms),
                    ],
                  ),
                ),
                SizedBox(height: compact ? 24 : 44),
                Text(
                  slide.eyebrow,
                  style: TextStyle(
                    color: slide.color,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2,
                    fontSize: 12,
                  ),
                ).animate().fadeIn(delay: 150.ms),
                const SizedBox(height: 10),
                Text(
                  slide.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    height: 1.12,
                    letterSpacing: -0.8,
                  ),
                ).animate().fadeIn(delay: 250.ms).slideY(begin: 0.2),
                const SizedBox(height: 14),
                Text(
                  slide.body,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 15.5,
                    height: 1.5,
                  ),
                ).animate().fadeIn(delay: 350.ms),
                const SizedBox(height: 24),
                for (final (i, pt) in slide.points.indexed)
                  Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          children: [
                            IconChip(pt.$1, color: slide.color, size: 36),
                            const SizedBox(width: 12),
                            Text(
                              pt.$2,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      )
                      .animate()
                      .fadeIn(delay: (450 + i * 120).ms)
                      .slideX(begin: 0.15),
              ],
            ),
          ),
        );
      },
    );
  }
}
