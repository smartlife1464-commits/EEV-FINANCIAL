/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleur principale de l'église : palette pilotée par la configuration de la plateforme
        amber: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((k) => [k, `rgb(var(--brand-${k}) / <alpha-value>)`])
        ),
        eev: {
          navy: '#091338',
          gold: '#FFBC00',
          dark: '#111827',
          surface: '#1F2937',
          primary: '#4F46E5',
          accent: '#7C3AED',
          success: '#16A34A',
          danger: '#DC2626',
          warning: '#F59E0B',
          muted: '#6B7280',
          light: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

