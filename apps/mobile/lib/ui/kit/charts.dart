import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../core/format.dart';
import '../../core/theme/app_colors.dart';

class TrendPoint {
  final String label;
  final double a;
  final double b;
  const TrendPoint(this.label, this.a, [this.b = 0]);
}

/// Courbe(s) lissée(s) avec dégradé, animée à l'affichage.
class AreaTrendChart extends StatelessWidget {
  final List<TrendPoint> points;
  final Color colorA;
  final Color? colorB;
  final String Function(double) format;
  final double height;
  final bool onDark;

  const AreaTrendChart({
    super.key,
    required this.points,
    this.colorA = AppColors.gold,
    this.colorB,
    this.format = _compact,
    this.height = 180,
    this.onDark = false,
  });

  static String _compact(double v) => Fmt.fcfaCompact(v);

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final muted = onDark ? Colors.white54 : p.textFaint;
    if (points.isEmpty || points.every((e) => e.a == 0 && e.b == 0)) {
      return SizedBox(
        height: height,
        child: Center(child: Text('Aucune donnée sur la période', style: TextStyle(color: muted, fontWeight: FontWeight.w600))),
      );
    }
    final maxY = points.fold<double>(0, (m, e) => [m, e.a, e.b].reduce((x, y) => x > y ? x : y)) * 1.2;
    final step = (points.length / 4).ceil().clamp(1, 99);

    LineChartBarData line(List<double> ys, Color c) => LineChartBarData(
          spots: [for (var i = 0; i < ys.length; i++) FlSpot(i.toDouble(), ys[i])],
          isCurved: true,
          preventCurveOverShooting: true,
          curveSmoothness: 0.32,
          barWidth: 3.2,
          color: c,
          dotData: const FlDotData(show: false),
          belowBarData: BarAreaData(
            show: true,
            gradient: LinearGradient(
              colors: [c.withValues(alpha: 0.35), c.withValues(alpha: 0)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        );

    return SizedBox(
      height: height,
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: maxY <= 0 ? 1 : maxY,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: maxY <= 0 ? 1 : maxY / 4,
            getDrawingHorizontalLine: (_) => FlLine(color: (onDark ? Colors.white : p.text).withValues(alpha: 0.06), strokeWidth: 1),
          ),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 26,
                interval: 1,
                getTitlesWidget: (v, meta) {
                  final i = v.toInt();
                  if (i < 0 || i >= points.length || i % step != 0) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(points[i].label, style: TextStyle(fontSize: 10.5, color: muted, fontWeight: FontWeight.w600)),
                  );
                },
              ),
            ),
          ),
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (_) => AppColors.navy.withValues(alpha: 0.95),
              tooltipBorderRadius: BorderRadius.circular(14),
              getTooltipItems: (spots) => spots
                  .map((s) => LineTooltipItem(
                        '${points[s.x.toInt()].label}\n${format(s.y)}',
                        TextStyle(color: s.bar.color, fontWeight: FontWeight.w800, fontSize: 12),
                      ))
                  .toList(),
            ),
          ),
          lineBarsData: [
            line(points.map((e) => e.a).toList(), colorA),
            if (colorB != null) line(points.map((e) => e.b).toList(), colorB!),
          ],
        ),
        duration: const Duration(milliseconds: 600),
      ),
    );
  }
}

class DonutSlice {
  final String label;
  final double value;
  final Color color;
  const DonutSlice(this.label, this.value, this.color);
}

/// Anneau de répartition avec valeur centrale
class DonutChart extends StatefulWidget {
  final List<DonutSlice> slices;
  final String centerValue;
  final String centerLabel;
  final double size;
  const DonutChart({super.key, required this.slices, required this.centerValue, required this.centerLabel, this.size = 150});

  @override
  State<DonutChart> createState() => _DonutChartState();
}

class _DonutChartState extends State<DonutChart> {
  int _touched = -1;

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    final total = widget.slices.fold<double>(0, (s, e) => s + e.value);
    final slices = total == 0 ? [DonutSlice('—', 1, p.border)] : widget.slices;
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Stack(alignment: Alignment.center, children: [
        PieChart(
          PieChartData(
            sectionsSpace: 3,
            centerSpaceRadius: widget.size * 0.33,
            startDegreeOffset: -90,
            pieTouchData: PieTouchData(touchCallback: (event, resp) {
              setState(() => _touched = (event.isInterestedForInteractions ? resp?.touchedSection?.touchedSectionIndex : -1) ?? -1);
            }),
            sections: [
              for (var i = 0; i < slices.length; i++)
                PieChartSectionData(
                  value: slices[i].value,
                  color: slices[i].color,
                  radius: i == _touched ? widget.size * 0.17 : widget.size * 0.14,
                  showTitle: false,
                ),
            ],
          ),
          duration: const Duration(milliseconds: 500),
        ),
        Column(mainAxisSize: MainAxisSize.min, children: [
          Text(widget.centerValue, style: TextStyle(fontSize: widget.size * 0.15, fontWeight: FontWeight.w900, color: p.text)),
          Text(widget.centerLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: p.textMuted)),
        ]),
      ]),
    );
  }
}

/// Barre de progression arrondie animée
class ProgressBar extends StatelessWidget {
  final double value;
  final Color color;
  final double height;
  const ProgressBar({super.key, required this.value, this.color = AppColors.gold, this.height = 8});

  @override
  Widget build(BuildContext context) {
    final p = Palette.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: Stack(children: [
        Container(height: height, color: p.border.withValues(alpha: 0.6)),
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: value.clamp(0, 1)),
          duration: const Duration(milliseconds: 900),
          curve: Curves.easeOutCubic,
          builder: (context, v, _) => FractionallySizedBox(
            widthFactor: v,
            child: Container(
              height: height,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [color.withValues(alpha: 0.7), color]),
                borderRadius: BorderRadius.circular(height),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}
