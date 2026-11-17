/**
 * Couleur principale de l'église (console de l'admin plateforme).
 * Génère la palette 50→950 utilisée par toutes les classes « amber-* » de l'interface.
 */
const DEFAULT_PRIMARY = '#FFBC00';
let primary = DEFAULT_PRIMARY;

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t)) as [number, number, number];

/** Couleur principale courante (graphiques, accents dessinés en SVG) */
export function brandColor(): string {
  return primary;
}

export function applyBrandColor(hex: string | undefined | null) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  primary = hex.toUpperCase();
  const root = document.documentElement;
  root.style.setProperty('--brand-hex', primary);
  if (primary === DEFAULT_PRIMARY) {
    // Palette ambre d'origine (définie dans index.css)
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach((k) => root.style.removeProperty(`--brand-${k}`));
    return;
  }
  const base = hexToRgb(primary);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  const shades: Record<number, [number, number, number]> = {
    50: mix(base, white, 0.9),
    100: mix(base, white, 0.78),
    200: mix(base, white, 0.58),
    300: mix(base, white, 0.32),
    400: base,
    500: mix(base, black, 0.1),
    600: mix(base, black, 0.24),
    700: mix(base, black, 0.38),
    800: mix(base, black, 0.5),
    900: mix(base, black, 0.6),
    950: mix(base, black, 0.75),
  };
  for (const [k, rgb] of Object.entries(shades)) root.style.setProperty(`--brand-${k}`, rgb.join(' '));
}
