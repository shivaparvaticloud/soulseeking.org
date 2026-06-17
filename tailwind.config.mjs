/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // ---- Dark-first premium canvas (Lusion / Palantir / Anduril register) ----
        void: '#08080A', // page base, near-black with a cool tint
        abyss: '#0B0C10',
        surface: '#121319', // raised panel
        'surface-2': '#191B22', // raised card
        mist: '#ECEAE3', // warm off-white text
        // ---- Warm soul accents (the one identity colour, used sparingly) ----
        gold: '#E7C68B',
        ochre: '#CC914E',
        ember: '#CC5B3A',
        oxblood: '#692828',
        earth: '#604C44',
        cream: '#EEEDE3',
        parchment: '#E3DAC9',
        // Legacy aliases kept so existing markup still resolves
        cosmos: '#08080A',
        'cosmos-soft': '#121319',
      },
      fontFamily: {
        // Modern grotesk for display + chrome
        sans: [
          '"Space Grotesk Variable"',
          '"Space Grotesk"',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '"Space Grotesk Variable"',
          '"Space Grotesk"',
          'system-ui',
          'sans-serif',
        ],
        // Garamond reserved for long-form reading + contemplative pull-quotes
        serif: [
          "'EB Garamond'",
          "'Garamond Local'",
          'Garamond',
          'Georgia',
          '"Times New Roman"',
          'serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
        wider: '0.1em',
        extreme: '0.2em',
        ultra: '0.34em',
      },
      spacing: {
        // Golden-ratio rhythm
        'phi-1': '1.618rem',
        'phi-2': '2.618rem',
        'phi-3': '4.236rem',
        'phi-4': '6.854rem',
        'phi-5': '11.090rem',
      },
      maxWidth: {
        reading: '38rem',
      },
      width: {
        'phi-main': '61.8%',
        'phi-sidebar': '38.2%',
      },
      lineHeight: {
        relaxed: '1.65',
        loose: '1.9',
      },
      typography: (theme) => ({
        soul: {
          css: {
            '--tw-prose-body': theme('colors.mist'),
            '--tw-prose-headings': theme('colors.mist'),
            '--tw-prose-lead': 'rgba(236,234,227,0.72)',
            '--tw-prose-links': theme('colors.gold'),
            '--tw-prose-bold': theme('colors.mist'),
            '--tw-prose-counters': theme('colors.ochre'),
            '--tw-prose-bullets': theme('colors.ochre'),
            '--tw-prose-hr': 'rgba(255,255,255,0.10)',
            '--tw-prose-quotes': 'rgba(236,234,227,0.86)',
            '--tw-prose-quote-borders': theme('colors.ochre'),
            '--tw-prose-captions': 'rgba(236,234,227,0.55)',
            '--tw-prose-code': theme('colors.gold'),
            '--tw-prose-pre-code': theme('colors.mist'),
            '--tw-prose-pre-bg': theme('colors.surface'),
            '--tw-prose-th-borders': 'rgba(255,255,255,0.12)',
            '--tw-prose-td-borders': 'rgba(255,255,255,0.08)',
            fontFamily: theme('fontFamily.serif').join(', '),
            lineHeight: theme('lineHeight.relaxed'),
            maxWidth: 'none',
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
