/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#22333B',
        slate: '#4E6572',
        mist: '#EAF2F7',
        cream: '#F7F3EA',
        sand: '#EAE2D2',
        line: '#E4DFD3',
        blue: '#4B7B9C',
        navy: '#2E4A5C',
        sage: '#7E9B85',
        coral: '#D97B5F',
        gold: '#B99A5B',
      },
      fontFamily: {
        display: ['"Avenir Next"', '"DIN Alternate"', '"Segoe UI Variable Display"', '"Segoe UI"', '"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(34, 51, 59, 0.04), 0 8px 24px -18px rgba(34, 51, 59, 0.28)',
        float: '0 18px 40px -22px rgba(34, 51, 59, 0.45)',
      },
      maxWidth: {
        app: '28rem',
      },
    },
  },
  plugins: [],
}
