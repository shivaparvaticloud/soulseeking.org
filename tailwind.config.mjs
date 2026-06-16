/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — Soul Seeking Project Summary (pp. 3-6)
        gold: '#E7C68B',
        ochre: '#CC914E',
        oxblood: '#692828',
        earth: '#604C44',
        cream: '#EEEDE3',
        parchment: '#E3DAC9',
        // Dark cosmos tones for revealed/scroll sections
        cosmos: '#15110D',
        'cosmos-soft': '#241B14',
      },
      fontFamily: {
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
            '--tw-prose-body': theme('colors.earth'),
            '--tw-prose-headings': theme('colors.earth'),
            '--tw-prose-lead': theme('colors.earth'),
            '--tw-prose-links': theme('colors.oxblood'),
            '--tw-prose-bold': theme('colors.earth'),
            '--tw-prose-counters': theme('colors.ochre'),
            '--tw-prose-bullets': theme('colors.ochre'),
            '--tw-prose-hr': theme('colors.gold'),
            '--tw-prose-quotes': theme('colors.earth'),
            '--tw-prose-quote-borders': theme('colors.ochre'),
            '--tw-prose-captions': theme('colors.earth'),
            '--tw-prose-code': theme('colors.oxblood'),
            '--tw-prose-pre-code': theme('colors.cream'),
            '--tw-prose-pre-bg': theme('colors.earth'),
            '--tw-prose-th-borders': theme('colors.gold'),
            '--tw-prose-td-borders': theme('colors.gold'),
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
