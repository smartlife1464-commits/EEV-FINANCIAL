import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'data/offline_queue.dart';
import 'data/storage.dart';
import 'state/notifications.dart';
import 'state/preferences.dart';
import 'state/session.dart';
import 'ui/screens/auth/login_screen.dart';
import 'ui/screens/onboarding/onboarding_screen.dart';
import 'ui/screens/shell/home_shell.dart';
import 'state/data_bus.dart';
import 'ui/screens/splash_screen.dart';

class EevApp extends StatelessWidget {
  const EevApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => Preferences()..load()),
        ChangeNotifierProvider(create: (_) => Session()),
        ChangeNotifierProvider(create: (_) => NotificationsCenter()),
        ChangeNotifierProvider(create: (_) => OfflineQueue()..load()),
        ChangeNotifierProvider(create: (_) => DataBus()),
      ],
      child: Consumer<Preferences>(
        builder: (context, prefs, _) => MaterialApp(
          title: 'Esprit & Vie',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: prefs.themeMode,
          locale: const Locale('fr'),
          supportedLocales: const [Locale('fr'), Locale('en')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const RootGate(),
        ),
      ),
    );
  }
}

/// Aiguillage racine : écran de démarrage → présentation (1re fois) → connexion → application.
class RootGate extends StatefulWidget {
  const RootGate({super.key});

  @override
  State<RootGate> createState() => _RootGateState();
}

class _RootGateState extends State<RootGate> {
  bool _splashDone = false;
  bool? _onboardingDone;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final session = context.read<Session>();
    await Future.wait([
      session.restore(),
      Storage.onboardingDone().then((v) => _onboardingDone = v),
      Future<void>.delayed(const Duration(milliseconds: 1700)),
    ]);
    if (mounted) setState(() => _splashDone = true);
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final Widget page;
    if (!_splashDone || session.status == SessionStatus.unknown) {
      page = const SplashScreen();
    } else if (session.isSignedIn) {
      page = const HomeShell();
    } else if (_onboardingDone == false) {
      page = OnboardingScreen(onDone: () async {
        await Storage.setOnboardingDone();
        setState(() => _onboardingDone = true);
      });
    } else {
      page = const LoginScreen();
    }
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 650),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, anim) => FadeTransition(
        opacity: anim,
        child: ScaleTransition(scale: Tween(begin: 0.98, end: 1.0).animate(anim), child: child),
      ),
      child: KeyedSubtree(key: ValueKey(page.runtimeType), child: page),
    );
  }
}
