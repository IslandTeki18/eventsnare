import type { Config } from 'tailwindcss';

// Shared Tailwind theme for all Eventsnare apps. App configs supply their own `content`.
// Scale and palette follow the Eventsnare dashboard redesign: dense type, hairline borders,
// near-monochrome ink with four semantic status hues.
const preset = {
  content: [],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        panel: 'hsl(var(--panel))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        subtle: 'hsl(var(--subtle))',
        border: {
          DEFAULT: 'hsl(var(--border))',
          soft: 'hsl(var(--border-soft))',
        },
        rail: 'hsl(var(--rail-off))',
        ok: 'hsl(var(--ok))',
        warn: 'hsl(var(--warn))',
        bad: 'hsl(var(--bad))',
        info: 'hsl(var(--info))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        '3xs': ['10px', '14px'],
        '2xs': ['11px', '15px'],
        xs: ['11.5px', '17px'],
        sm: ['12.5px', '18px'],
        base: ['13px', '19px'],
        lg: ['14px', '20px'],
        xl: ['17px', '23px'],
        '2xl': ['23px', '28px'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 1px)',
        sm: 'calc(var(--radius) - 3px)',
      },
    },
  },
  plugins: [],
} satisfies Omit<Config, 'content'> & { content: [] };

export default preset;
