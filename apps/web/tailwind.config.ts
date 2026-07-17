export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fffaeb',
        surface: '#fff0c2',
        accent: '#fa520f',
        'accent-light': '#ffa110',
        'text-primary': '#1f1f1f',
        'text-secondary': '#767d88',
        dark: '#1f1f1f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm': 'rgba(127, 99, 21, 0.12) -8px 16px 39px, rgba(127, 99, 21, 0.1) -33px 64px 72px',
        'warm-sm': 'rgba(127, 99, 21, 0.08) 0px 4px 12px',
      },
    },
  },
  plugins: [],
}