// Tailwind preset. Colours reference the CSS variables in tokens.css so there is one source of truth.
export default {
  theme: {
    extend: {
      colors: {
        void: 'var(--ts-void)', panel: 'var(--ts-panel)', raised: 'var(--ts-raised)', selected: 'var(--ts-selected)',
        line: 'var(--ts-line)', 'line-strong': 'var(--ts-line-strong)',
        ink: { DEFAULT: 'var(--ts-text)', 2: 'var(--ts-text-2)', 3: 'var(--ts-text-3)' },
        accent: { DEFAULT: 'var(--ts-accent)', on: 'var(--ts-on-accent)', wash: 'var(--ts-accent-wash)' },
        ok: 'var(--ts-ok)', bad: 'var(--ts-bad)',
        hover: 'var(--ts-fill-hover)', subtle: 'var(--ts-fill-subtle)',
      },
      fontFamily: { sans: ['var(--ts-sans)'], mono: ['var(--ts-mono)'], serif: ['var(--ts-serif)'] },
      borderRadius: { control: '8px', pill: '12px', panel: '16px', sheet: '22px' },
      boxShadow: { panel: 'var(--ts-shadow-1)', pop: 'var(--ts-shadow-2)', sheet: 'var(--ts-shadow-sheet)' },
      transitionTimingFunction: { settle: 'cubic-bezier(.2,.8,.2,1)', glide: 'cubic-bezier(.65,0,.35,1)' },
      spacing: { rail: '64px', 'panel-w': '336px', 'inspector-w': '320px', 'dock-w': '580px' },
    },
  },
}
