// Lottie Animation Data Definitions for Ministère Esprit & Vie Onboarding
// Formats 100% conformes à la spécification Bodymovin / Lottie

export const welcomeLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 180,
  w: 300,
  h: 300,
  nm: 'Welcome Animation',
  ddd: 0,
  assets: [],
  layers: [
    // Outer Pulsing Gold Aura
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Outer Aura',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [30] },
            { t: 90, s: [75] },
            { t: 180, s: [30] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [85, 85, 100] },
            { t: 90, s: [115, 115, 100] },
            { t: 180, s: [85, 85, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Circle Group',
          it: [
            { ty: 'el', nm: 'Aura', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [180, 180] } },
            {
              ty: 'fl',
              nm: 'Fill Gold Glow',
              c: { a: 0, k: [1, 0.737, 0, 1] },
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
    // Rotating Ring
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Rotating Ring',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 180, s: [360] },
          ],
        },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 90, s: [105, 105, 100] },
            { t: 180, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Ring Group',
          it: [
            { ty: 'el', nm: 'Ring Path', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [140, 140] } },
            {
              ty: 'st',
              nm: 'Ring Stroke',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 90 },
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
    // Inner Radiant Star
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Inner Core',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 180, s: [-180] },
          ],
        },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100] },
            { t: 90, s: [110, 110, 100] },
            { t: 180, s: [90, 90, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Diamond Core',
          it: [
            {
              ty: 'rc',
              nm: 'Square',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [50, 50] },
              r: { a: 0, k: 12 },
            },
            {
              ty: 'fl',
              nm: 'Fill Star',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 95 },
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
  ],
};

export const roleLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 180,
  w: 300,
  h: 300,
  nm: 'Role Authority Animation',
  ddd: 0,
  assets: [],
  layers: [
    // Pulsing Outer Hexagon Ring
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Shield Outline',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 180, s: [360] },
          ],
        },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [95, 95, 100] },
            { t: 90, s: [108, 108, 100] },
            { t: 180, s: [95, 95, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Hexagon Group',
          it: [
            { ty: 'el', nm: 'Outer Circle', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [150, 150] } },
            {
              ty: 'st',
              nm: 'Stroke Gold',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 90 },
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
      ],
    },
    // Inner Insignia Shield Badge
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Center Badge',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-5] },
            { t: 90, s: [5] },
            { t: 180, s: [-5] },
          ],
        },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 90, s: [112, 112, 100] },
            { t: 180, s: [100, 100, 100] },
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
              nm: 'Badge Body',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [70, 85] },
              r: { a: 0, k: 16 },
            },
            {
              ty: 'fl',
              nm: 'Shield Fill',
              c: { a: 0, k: [0.035, 0.075, 0.22, 1] },
              o: { a: 0, k: 95 },
            },
            {
              ty: 'st',
              nm: 'Shield Stroke',
              c: { a: 0, k: [1, 0.737, 0, 1] },
              o: { a: 0, k: 100 },
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
    // Center Gold Crown/Star Dot
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Gold Dot',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [80, 80, 100] },
            { t: 90, s: [120, 120, 100] },
            { t: 180, s: [80, 80, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Center Dot',
          it: [
            { ty: 'el', nm: 'Star Dot', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [24, 24] } },
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
      ],
    },
  ],
};

export const analyticsLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 180,
  w: 300,
  h: 300,
  nm: 'Analytics Charts Animation',
  ddd: 0,
  assets: [],
  layers: [
    // Bar 1 (Left)
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Bar 1',
      sr: 1,
      ks: {
        o: { a: 0, k: 90 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 180, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 50, 100] },
            { t: 90, s: [100, 90, 100] },
            { t: 180, s: [100, 50, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Bar 1 Shape',
          it: [
            { ty: 'rc', nm: 'Rect', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [24, 80] }, r: { a: 0, k: 6 } },
            { ty: 'fl', nm: 'Fill', c: { a: 0, k: [0.23, 0.51, 0.96, 1] }, o: { a: 0, k: 95 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    // Bar 2 (Center)
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Bar 2',
      sr: 1,
      ks: {
        o: { a: 0, k: 95 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 80, 100] },
            { t: 90, s: [100, 125, 100] },
            { t: 180, s: [100, 80, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Bar 2 Shape',
          it: [
            { ty: 'rc', nm: 'Rect', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [24, 110] }, r: { a: 0, k: 6 } },
            { ty: 'fl', nm: 'Fill', c: { a: 0, k: [1, 0.737, 0, 1] }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    // Bar 3 (Right)
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Bar 3',
      sr: 1,
      ks: {
        o: { a: 0, k: 90 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [200, 140, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 110, 100] },
            { t: 90, s: [100, 150, 100] },
            { t: 180, s: [100, 110, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Bar 3 Shape',
          it: [
            { ty: 'rc', nm: 'Rect', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [24, 140] }, r: { a: 0, k: 6 } },
            { ty: 'fl', nm: 'Fill', c: { a: 0, k: [0.063, 0.725, 0.506, 1] }, o: { a: 0, k: 95 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    // Trend Arrow Ring
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'Sparkle Dot',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [100, 130, 0] },
            { t: 90, s: [200, 70, 0] },
            { t: 180, s: [100, 130, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Dot Group',
          it: [
            { ty: 'el', nm: 'Dot', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [16, 16] } },
            { ty: 'fl', nm: 'Fill', c: { a: 0, k: [1, 0.84, 0, 1] }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
  ],
};

export const securityLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 180,
  w: 300,
  h: 300,
  nm: 'Security Shield Animation',
  ddd: 0,
  assets: [],
  layers: [
    // Outer Protective Pulse
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Pulse Circle',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [20] },
            { t: 90, s: [60] },
            { t: 180, s: [20] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [80, 80, 100] },
            { t: 90, s: [120, 120, 100] },
            { t: 180, s: [80, 80, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Ring Group',
          it: [
            { ty: 'el', nm: 'Ring', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [160, 160] } },
            { ty: 'st', nm: 'Stroke', c: { a: 0, k: [1, 0.737, 0, 1] }, o: { a: 0, k: 80 }, w: { a: 0, k: 4 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    // Central Padlock Body
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Lock Body',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 160, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 90, s: [108, 108, 100] },
            { t: 180, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Body Group',
          it: [
            { ty: 'rc', nm: 'Padlock Box', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [80, 65] }, r: { a: 0, k: 16 } },
            { ty: 'fl', nm: 'Body Fill', c: { a: 0, k: [1, 0.737, 0, 1] }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    // Lock Shackle Arch
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Lock Shackle',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [150, 120, 0] },
            { t: 90, s: [150, 112, 0] },
            { t: 180, s: [150, 120, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Shackle Group',
          it: [
            { ty: 'el', nm: 'Shackle Arc', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [50, 55] } },
            { ty: 'st', nm: 'Shackle Stroke', c: { a: 0, k: [1, 0.85, 0.2, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 8 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
  ],
};

export const workflowLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 180,
  w: 300,
  h: 300,
  nm: 'Workflow Document Animation',
  ddd: 0,
  assets: [],
  layers: [
    // Background Document Sheet
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Doc Sheet',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [-3] },
            { t: 90, s: [3] },
            { t: 180, s: [-3] },
          ],
        },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [95, 95, 100] },
            { t: 90, s: [105, 105, 100] },
            { t: 180, s: [95, 95, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Doc Group',
          it: [
            { ty: 'rc', nm: 'Doc Shape', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 130] }, r: { a: 0, k: 14 } },
            { ty: 'fl', nm: 'Doc Fill', c: { a: 0, k: [0.08, 0.15, 0.35, 1] }, o: { a: 0, k: 95 } },
            { ty: 'st', nm: 'Doc Stroke', c: { a: 0, k: [1, 0.737, 0, 1] }, o: { a: 0, k: 90 }, w: { a: 0, k: 4 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    // Certified Stamp Seal
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Stamp Seal',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 180, s: [360] },
          ],
        },
        p: { a: 0, k: [175, 185, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100] },
            { t: 90, s: [120, 120, 100] },
            { t: 180, s: [90, 90, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Seal Group',
          it: [
            { ty: 'el', nm: 'Seal Circle', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [46, 46] } },
            { ty: 'fl', nm: 'Seal Fill', c: { a: 0, k: [0.063, 0.725, 0.506, 1] }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
  ],
};

export const celebrationLottie = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 180,
  w: 300,
  h: 300,
  nm: 'Celebration Launch Animation',
  ddd: 0,
  assets: [],
  layers: [
    // Expanding Fireworks Ring
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Burst Ring',
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [100] },
            { t: 120, s: [0] },
            { t: 180, s: [100] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [30, 30, 100] },
            { t: 120, s: [140, 140, 100] },
            { t: 180, s: [30, 30, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Burst Ring Group',
          it: [
            { ty: 'el', nm: 'Burst Circle', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [120, 120] } },
            { ty: 'st', nm: 'Burst Stroke', c: { a: 0, k: [1, 0.737, 0, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 5 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
    // Center Star Core
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Victory Star',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 180, s: [360] },
          ],
        },
        p: { a: 0, k: [150, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [85, 85, 100] },
            { t: 90, s: [125, 125, 100] },
            { t: 180, s: [85, 85, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'gr',
          nm: 'Star Core Group',
          it: [
            { ty: 'rc', nm: 'Star Square 1', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [50, 50] }, r: { a: 0, k: 10 } },
            { ty: 'fl', nm: 'Star Fill 1', c: { a: 0, k: [1, 0.737, 0, 1] }, o: { a: 0, k: 100 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          nm: 'Star Core Group 2',
          it: [
            { ty: 'rc', nm: 'Star Square 2', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [50, 50] }, r: { a: 0, k: 10 } },
            { ty: 'fl', nm: 'Star Fill 2', c: { a: 0, k: [1, 0.85, 0.3, 1] }, o: { a: 0, k: 90 } },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 45 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
    },
  ],
};

