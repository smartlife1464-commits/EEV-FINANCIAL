// Lottie Animation Definitions for Post-Login Role Preloader
// Formats 100% conformes à la spécification Bodymovin / Lottie
import { UserRole } from '@eev/shared-types';

/**
 * 1. Animation Pasteur Principal & Gouvernance Royale
 * Thème : Or Céleste (#FFBC00) & Pourpre (#7C3AED)
 * Symboles : Couronne à 5 pointes, halo de lumière rayonnant, sceau royal et croix triomphante
 */
export const pastorLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 300, // 5 secondes complètes
  w: 320,
  h: 320,
  nm: 'Pastor Leadership & Governance',
  ddd: 0,
  assets: [],
  layers: [
    // 1. Grand Halo Céleste Pulsant Doré
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Halo Doré',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [30] },
            { t: 75, s: [85] },
            { t: 150, s: [30] },
            { t: 225, s: [85] },
            { t: 300, s: [30] },
          ],
        },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 300, s: [360] },
          ],
        },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [80, 80, 100] },
            { t: 75, s: [120, 120, 100] },
            { t: 150, s: [80, 80, 100] },
            { t: 225, s: [120, 120, 100] },
            { t: 300, s: [80, 80, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Halo Group',
          it: [
            { ty: 'el', nm: 'Aura', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [220, 220] } },
            {
              ty: 'fl',
              nm: 'Fill Glow',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 35 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 2. Étoile Rayonnante à 8 branches en Rotation Lente
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Rayons Royaux',
      sr: 1,
      ks: {
        o: { a: 0, k: 60 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 300, s: [180] },
          ],
        },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100] },
            { t: 150, s: [110, 110, 100] },
            { t: 300, s: [90, 90, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Star Rays',
          it: [
            {
              ty: 'sr',
              nm: 'Star',
              sy: 1,
              pt: { a: 0, k: 8 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              or: { a: 0, k: 105 },
              os: { a: 0, k: 0 },
              ir: { a: 0, k: 55 },
              is: { a: 0, k: 0 },
            },
            {
              ty: 'st',
              nm: 'Gold Stroke',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              w: { a: 0, k: 3 },
              o: { a: 0, k: 70 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 3. Sceau Royal Central Pourpre & Or
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Sceau Pourpre',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [95, 95, 100] },
            { t: 75, s: [105, 105, 100] },
            { t: 150, s: [95, 95, 100] },
            { t: 225, s: [105, 105, 100] },
            { t: 300, s: [95, 95, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Purple Disc',
          it: [
            { ty: 'el', nm: 'Disc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [120, 120] } },
            {
              ty: 'fl',
              nm: 'Fill Purple',
              c: { a: 0, k: [0.388, 0.145, 0.784, 1] }, // #6325C8
              o: { a: 0, k: 95 },
            },
            {
              ty: 'st',
              nm: 'Stroke Gold',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              w: { a: 0, k: 4 },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 4. Couronne Pastorale Dorée
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'Couronne Royale',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-4] },
            { t: 75, s: [4] },
            { t: 150, s: [-4] },
            { t: 225, s: [4] },
            { t: 300, s: [-4] },
          ],
        },
        p: { a: 0, k: [160, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 150, s: [112, 112, 100] },
            { t: 300, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Crown Base',
          it: [
            {
              ty: 'rc',
              nm: 'Base',
              p: { a: 0, k: [0, 20] },
              s: { a: 0, k: [60, 10] },
              r: { a: 0, k: 4 },
            },
            {
              ty: 'fl',
              nm: 'Fill Gold',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
        {
          ty: 'gr',
          nm: 'Crown Peaks',
          it: [
            {
              ty: 'sr',
              nm: 'Center Peak',
              sy: 1,
              pt: { a: 0, k: 3 },
              p: { a: 0, k: [0, -4] },
              r: { a: 0, k: 0 },
              or: { a: 0, k: 25 },
              os: { a: 0, k: 0 },
              ir: { a: 0, k: 12 },
              is: { a: 0, k: 0 },
            },
            {
              ty: 'fl',
              nm: 'Gold Fill',
              c: { a: 0, k: [1, 0.82, 0.2, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 5. Croix Glorieuse Lumineuse
    {
      ddd: 0,
      ind: 5,
      ty: 4,
      nm: 'Croix Lumineuse',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [80] },
            { t: 75, s: [100] },
            { t: 150, s: [80] },
            { t: 225, s: [100] },
            { t: 300, s: [80] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 185, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Cross Vertical',
          it: [
            {
              ty: 'rc',
              nm: 'Vert',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [6, 26] },
              r: { a: 0, k: 2 },
            },
            {
              ty: 'fl',
              nm: 'White Fill',
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
        {
          ty: 'gr',
          nm: 'Cross Horizontal',
          it: [
            {
              ty: 'rc',
              nm: 'Horiz',
              p: { a: 0, k: [0, -5] },
              s: { a: 0, k: [18, 6] },
              r: { a: 0, k: 2 },
            },
            {
              ty: 'fl',
              nm: 'White Fill',
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },
  ],
};

/**
 * 2. Animation Finances & Trésorerie Céleste
 * Thème : Vert Émeraude (#10B981) & Or Caisse (#F59E0B)
 * Symboles : Coffre-fort scellé, pièce dorée tournoyante 3D, balance de rigueur et barres d'abondance
 */
export const financeLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 300,
  w: 320,
  h: 320,
  nm: 'Finance & Treasury Management',
  ddd: 0,
  assets: [],
  layers: [
    // 1. Halo Pulsant Vert Émeraude
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Émeraude Glow',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [25] },
            { t: 75, s: [75] },
            { t: 150, s: [25] },
            { t: 225, s: [75] },
            { t: 300, s: [25] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [85, 85, 100] },
            { t: 75, s: [125, 125, 100] },
            { t: 150, s: [85, 85, 100] },
            { t: 225, s: [125, 125, 100] },
            { t: 300, s: [85, 85, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Emerald Circle',
          it: [
            { ty: 'el', nm: 'Aura', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [210, 210] } },
            {
              ty: 'fl',
              nm: 'Fill Emerald',
              c: { a: 0, k: [0.063, 0.725, 0.506, 1] }, // #10B981
              o: { a: 0, k: 30 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 2. Coffre Sacré / Écrin Hexagonal Tournant
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Cadre Hexagonal',
      sr: 1,
      ks: {
        o: { a: 0, k: 70 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 300, s: [360] },
          ],
        },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Hexagon',
          it: [
            {
              ty: 'sr',
              nm: 'Poly',
              sy: 2,
              pt: { a: 0, k: 6 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              or: { a: 0, k: 95 },
              os: { a: 0, k: 8 },
            },
            {
              ty: 'st',
              nm: 'Gold Stroke',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              w: { a: 0, k: 3.5 },
              o: { a: 0, k: 85 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 3. Pièce d'Or 3D Tournoyante au Centre
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Pièce d\'Or 3D',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 37, s: [15, 100, 100] },
            { t: 75, s: [-100, 100, 100] },
            { t: 112, s: [-15, 100, 100] },
            { t: 150, s: [100, 100, 100] },
            { t: 187, s: [15, 100, 100] },
            { t: 225, s: [-100, 100, 100] },
            { t: 262, s: [-15, 100, 100] },
            { t: 300, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Gold Coin',
          it: [
            { ty: 'el', nm: 'Coin Disc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [90, 90] } },
            {
              ty: 'fl',
              nm: 'Gold Coin Fill',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'st',
              nm: 'Coin Rim',
              c: { a: 0, k: [0.95, 0.6, 0, 1] },
              w: { a: 0, k: 5 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
        {
          ty: 'gr',
          nm: 'Coin Inner Symbol',
          it: [
            {
              ty: 'rc',
              nm: 'Vert Bar',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [6, 40] },
              r: { a: 0, k: 2 },
            },
            {
              ty: 'fl',
              nm: 'White Fill',
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 90 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 4. Barres de Croissance & Abondance
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'Barres de Croissance',
      sr: 1,
      ks: {
        o: { a: 0, k: 90 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 225, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Bar 1',
          it: [
            {
              ty: 'rc',
              nm: 'B1',
              p: { a: 0, k: [-30, 0] },
              s: {
                a: 1,
                k: [
                  { t: 0, s: [10, 16] },
                  { t: 150, s: [10, 28] },
                  { t: 300, s: [10, 16] },
                ],
              },
              r: { a: 0, k: 3 },
            },
            {
              ty: 'fl',
              nm: 'Emerald Fill',
              c: { a: 0, k: [0.063, 0.725, 0.506, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
        {
          ty: 'gr',
          nm: 'Bar 2',
          it: [
            {
              ty: 'rc',
              nm: 'B2',
              p: { a: 0, k: [0, -6] },
              s: {
                a: 1,
                k: [
                  { t: 0, s: [10, 28] },
                  { t: 150, s: [10, 42] },
                  { t: 300, s: [10, 28] },
                ],
              },
              r: { a: 0, k: 3 },
            },
            {
              ty: 'fl',
              nm: 'Gold Fill',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
        {
          ty: 'gr',
          nm: 'Bar 3',
          it: [
            {
              ty: 'rc',
              nm: 'B3',
              p: { a: 0, k: [30, -12] },
              s: {
                a: 1,
                k: [
                  { t: 0, s: [10, 40] },
                  { t: 150, s: [10, 56] },
                  { t: 300, s: [10, 40] },
                ],
              },
              r: { a: 0, k: 3 },
            },
            {
              ty: 'fl',
              nm: 'Emerald Fill Light',
              c: { a: 0, k: [0.2, 0.85, 0.6, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },
  ],
};

/**
 * 3. Animation Protocole & Fréquentation des Rassemblements
 * Thème : Bleu Céleste (#0284C7) & Or Accueil (#F59E0B)
 * Symboles : Colombe de l'Esprit aux ailes battantes, ondes de rassemblement des foules et sanctuaire
 */
export const protocolLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 300,
  w: 320,
  h: 320,
  nm: 'Protocol & Attendance Gathering',
  ddd: 0,
  assets: [],
  layers: [
    // 1. Ondes de Rassemblement Concentriques
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Ondes Concentriques',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [30] },
            { t: 150, s: [75] },
            { t: 300, s: [30] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [70, 70, 100] },
            { t: 150, s: [130, 130, 100] },
            { t: 300, s: [70, 70, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Wave Ring 1',
          it: [
            { ty: 'el', nm: 'Ring1', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [180, 180] } },
            {
              ty: 'st',
              nm: 'Blue Stroke',
              c: { a: 0, k: [0.01, 0.52, 0.78, 1] }, // #0284C7
              w: { a: 0, k: 3 },
              o: { a: 0, k: 60 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
        {
          ty: 'gr',
          nm: 'Wave Ring 2',
          it: [
            { ty: 'el', nm: 'Ring2', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [230, 230] } },
            {
              ty: 'st',
              nm: 'Gold Stroke',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              w: { a: 0, k: 2 },
              o: { a: 0, k: 45 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 2. Disque Central d'Accueil
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Disque Sanctuaire',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [95, 95, 100] },
            { t: 75, s: [105, 105, 100] },
            { t: 150, s: [95, 95, 100] },
            { t: 225, s: [105, 105, 100] },
            { t: 300, s: [95, 95, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Central Disc',
          it: [
            { ty: 'el', nm: 'Disc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [110, 110] } },
            {
              ty: 'fl',
              nm: 'Fill Cyan Deep',
              c: { a: 0, k: [0.03, 0.35, 0.65, 1] },
              o: { a: 0, k: 95 },
            },
            {
              ty: 'st',
              nm: 'Stroke Gold',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              w: { a: 0, k: 3.5 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 3. Colombe Céleste Animée (Battement d'ailes)
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Colombe Protocole',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-3] },
            { t: 75, s: [3] },
            { t: 150, s: [-3] },
            { t: 225, s: [3] },
            { t: 300, s: [-3] },
          ],
        },
        p: { a: 0, k: [160, 155, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 37, s: [105, 80, 100] },
            { t: 75, s: [100, 100, 100] },
            { t: 112, s: [105, 80, 100] },
            { t: 150, s: [100, 100, 100] },
            { t: 187, s: [105, 80, 100] },
            { t: 225, s: [100, 100, 100] },
            { t: 262, s: [105, 80, 100] },
            { t: 300, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Dove Body',
          it: [
            {
              ty: 'el',
              nm: 'Body',
              p: { a: 0, k: [0, 4] },
              s: { a: 0, k: [22, 34] },
            },
            {
              ty: 'fl',
              nm: 'White Fill',
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
        {
          ty: 'gr',
          nm: 'Wings Left & Right',
          it: [
            {
              ty: 'el',
              nm: 'Wing Left',
              p: { a: 0, k: [-22, -4] },
              s: { a: 0, k: [32, 14] },
            },
            {
              ty: 'el',
              nm: 'Wing Right',
              p: { a: 0, k: [22, -4] },
              s: { a: 0, k: [32, 14] },
            },
            {
              ty: 'fl',
              nm: 'Wing Gold Fill',
              c: { a: 0, k: [1, 0.85, 0.3, 1] },
              o: { a: 0, k: 95 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 4. Quatre Icônes de Fidèles Rassemblés
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'Fidèles Rassemblés',
      sr: 1,
      ks: {
        o: { a: 0, k: 90 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 300, s: [360] },
          ],
        },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Satellite Dots',
          it: [
            { ty: 'el', nm: 'D1', p: { a: 0, k: [0, -78] }, s: { a: 0, k: [14, 14] } },
            { ty: 'el', nm: 'D2', p: { a: 0, k: [78, 0] }, s: { a: 0, k: [14, 14] } },
            { ty: 'el', nm: 'D3', p: { a: 0, k: [0, 78] }, s: { a: 0, k: [14, 14] } },
            { ty: 'el', nm: 'D4', p: { a: 0, k: [-78, 0] }, s: { a: 0, k: [14, 14] } },
            {
              ty: 'fl',
              nm: 'Fill Gold Dot',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },
  ],
};

/**
 * 4. Animation Administration & Audit / Contrôle Interne
 * Thème : Bleu Cobalt (#1D4ED8), Violet (#7C3AED) & Or Sceau
 * Symboles : Bouclier de cybersécurité, faisceau de contrôle d'intégrité, clé d'autorité et sceau certifié
 */
export const adminLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 300,
  w: 320,
  h: 320,
  nm: 'Admin & Internal Audit Governance',
  ddd: 0,
  assets: [],
  layers: [
    // 1. Halo Radar de Sécurité
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Radar Glow',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [30] },
            { t: 75, s: [80] },
            { t: 150, s: [30] },
            { t: 225, s: [80] },
            { t: 300, s: [30] },
          ],
        },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 300, s: [360] },
          ],
        },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Security Circles',
          it: [
            { ty: 'el', nm: 'CircleOuter', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [220, 220] } },
            {
              ty: 'st',
              nm: 'Dashed Stroke',
              c: { a: 0, k: [0.11, 0.31, 0.85, 1] },
              w: { a: 0, k: 2.5 },
              o: { a: 0, k: 50 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 2. Bouclier Protecteur Central
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Bouclier de Sécurité',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [95, 95, 100] },
            { t: 75, s: [105, 105, 100] },
            { t: 150, s: [95, 95, 100] },
            { t: 225, s: [105, 105, 100] },
            { t: 300, s: [95, 95, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Shield Shape',
          it: [
            {
              ty: 'rc',
              nm: 'Shield Base',
              p: { a: 0, k: [0, -10] },
              s: { a: 0, k: [90, 80] },
              r: { a: 0, k: 16 },
            },
            {
              ty: 'sr',
              nm: 'Shield Bottom',
              sy: 1,
              pt: { a: 0, k: 3 },
              p: { a: 0, k: [0, 20] },
              r: { a: 0, k: 180 },
              or: { a: 0, k: 50 },
              os: { a: 0, k: 0 },
              ir: { a: 0, k: 25 },
              is: { a: 0, k: 0 },
            },
            {
              ty: 'fl',
              nm: 'Shield Fill Deep Blue',
              c: { a: 0, k: [0.08, 0.16, 0.45, 1] },
              o: { a: 0, k: 95 },
            },
            {
              ty: 'st',
              nm: 'Shield Gold Border',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              w: { a: 0, k: 4 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 3. Clé d'Autorité / Coche de Certification Lumineuse
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Sceau de Conformité',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [160, 155, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100] },
            { t: 150, s: [110, 110, 100] },
            { t: 300, s: [90, 90, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Checkmark',
          it: [
            {
              ty: 'rc',
              nm: 'Arm1',
              p: { a: 0, k: [-10, 2] },
              s: { a: 0, k: [8, 22] },
              r: { a: 0, k: 3 },
            },
            {
              ty: 'rc',
              nm: 'Arm2',
              p: { a: 0, k: [12, -4] },
              s: { a: 0, k: [8, 42] },
              r: { a: 0, k: 3 },
            },
            {
              ty: 'fl',
              nm: 'White Fill',
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 45 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },

    // 4. Ligne Laser de Balayage d'Audit (Scan de haut en bas)
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'Faisceau Scanner',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [20] },
            { t: 75, s: [90] },
            { t: 150, s: [20] },
            { t: 225, s: [90] },
            { t: 300, s: [20] },
          ],
        },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [160, 110, 0] },
            { t: 150, s: [160, 210, 0] },
            { t: 300, s: [160, 110, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Scan Line',
          it: [
            {
              ty: 'rc',
              nm: 'Line',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [110, 4] },
              r: { a: 0, k: 2 },
            },
            {
              ty: 'fl',
              nm: 'Cyan Laser Fill',
              c: { a: 0, k: [0.23, 0.85, 1, 1] },
              o: { a: 0, k: 90 },
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Sélecteur d'animation Lottie selon le rôle ecclésiastique
 */
export function getRoleLottieAnimation(role?: UserRole | string) {
  switch (role) {
    case UserRole.LEAD_PASTOR:
      return pastorLottie;
    case UserRole.FINANCE_LEAD:
    case UserRole.CASHIER:
      return financeLottie;
    case UserRole.PROTOCOL_LEAD:
    case UserRole.PROTOCOL_AGENT:
      return protocolLottie;
    case UserRole.ADMIN:
    case UserRole.AUDITOR:
    default:
      return adminLottie;
  }
}

export interface RoleConfigMeta {
  roleLabel: string;
  department: string;
  badgeEmoji: string;
  colorHex: string;
  badgeClasses: string;
  targetDashboard: string;
  themeGradientLight: string;
  themeGradientDark: string;
  accentText: string;
}

export function getRoleConfigMeta(role?: UserRole | string): RoleConfigMeta {
  switch (role) {
    case UserRole.LEAD_PASTOR:
      return {
        roleLabel: 'PASTEUR PRINCIPAL',
        department: 'Gouvernance & Vision Apostolique',
        badgeEmoji: '👑',
        colorHex: '#FFBC00',
        badgeClasses: 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border-amber-400/40',
        targetDashboard: 'Tableau de Bord Exécutif & Trésorerie Supérieure',
        themeGradientLight: 'from-amber-500/10 via-amber-400/5 to-white',
        themeGradientDark: 'from-[#0C1530] via-[#091338] to-[#060D24]',
        accentText: 'text-amber-500',
      };
    case UserRole.FINANCE_LEAD:
      return {
        roleLabel: 'RESPONSABLE FINANCES',
        department: 'Direction Financière & Ordonnancement',
        badgeEmoji: '💼',
        colorHex: '#10B981',
        badgeClasses: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
        targetDashboard: 'Direction Financière & Suivi Budgétaire',
        themeGradientLight: 'from-emerald-500/10 via-emerald-400/5 to-white',
        themeGradientDark: 'from-[#062419] via-[#091338] to-[#060D24]',
        accentText: 'text-emerald-500',
      };
    case UserRole.CASHIER:
      return {
        roleLabel: 'CAISSIER PRINCIPAL',
        department: 'Caisse Centrale & Clôture Contradictoire',
        badgeEmoji: '🪙',
        colorHex: '#10B981',
        badgeClasses: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
        targetDashboard: 'Journal de Caisse & Rapprochement Physique',
        themeGradientLight: 'from-emerald-500/10 via-emerald-400/5 to-white',
        themeGradientDark: 'from-[#062419] via-[#091338] to-[#060D24]',
        accentText: 'text-emerald-500',
      };
    case UserRole.PROTOCOL_LEAD:
      return {
        roleLabel: 'RESPONSABLE DU PROTOCOLE',
        department: 'Accueil, Ordre & Fréquentation des Cultes',
        badgeEmoji: '🕊️',
        colorHex: '#0284C7',
        badgeClasses: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40',
        targetDashboard: 'Portail Protocole & Suivi des Rassemblements',
        themeGradientLight: 'from-sky-500/10 via-sky-400/5 to-white',
        themeGradientDark: 'from-[#071E3D] via-[#091338] to-[#060D24]',
        accentText: 'text-sky-500',
      };
    case UserRole.PROTOCOL_AGENT:
      return {
        roleLabel: 'AGENT DU PROTOCOLE',
        department: 'Comptage & Accueil des Rassemblements',
        badgeEmoji: '📋',
        colorHex: '#0284C7',
        badgeClasses: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40',
        targetDashboard: 'Fiches de Fréquentation & Saisie Culte',
        themeGradientLight: 'from-sky-500/10 via-sky-400/5 to-white',
        themeGradientDark: 'from-[#071E3D] via-[#091338] to-[#060D24]',
        accentText: 'text-sky-500',
      };
    case UserRole.AUDITOR:
      return {
        roleLabel: 'AUDITEUR / CONTRÔLEUR',
        department: 'Contrôle Interne & Certification des Comptes',
        badgeEmoji: '⚖️',
        colorHex: '#8B5CF6',
        badgeClasses: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40',
        targetDashboard: 'Contrôle des Écritures & Procès-Verbaux',
        themeGradientLight: 'from-purple-500/10 via-purple-400/5 to-white',
        themeGradientDark: 'from-[#1C0F38] via-[#091338] to-[#060D24]',
        accentText: 'text-purple-500',
      };
    case UserRole.ADMIN:
    default:
      return {
        roleLabel: 'ADMINISTRATEUR SYSTÈME',
        department: 'Gouvernance Numérique & Infrastructure',
        badgeEmoji: '🛡️',
        colorHex: '#3B82F6',
        badgeClasses: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40',
        targetDashboard: 'Console d\'Administration & Journal d\'Audit',
        themeGradientLight: 'from-blue-500/10 via-blue-400/5 to-white',
        themeGradientDark: 'from-[#0C1530] via-[#091338] to-[#060D24]',
        accentText: 'text-blue-500',
      };
  }
}
