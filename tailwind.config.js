/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#ECE8DF',
        paper: '#FBF9F5',
        ink: '#242729',
        slate: '#737978',
        mist: '#E9EFEB',
        cream: '#F4EFE6',
        sand: '#E1DACE',
        line: '#E2DCD2',
        blue: '#536E6F',
        navy: '#293B3C',
        sage: '#7A8F82',
        coral: '#A9705A',
        gold: '#8B7252',
      },
      fontFamily: {
        display: ['"Avenir Next"', '"SF Pro Display"', '"Segoe UI Variable Display"', '"Segoe UI"', '"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
        sans: ['"Avenir Next"', '"SF Pro Text"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(36, 39, 41, 0.04)',
        float: '0 24px 64px -52px rgba(36, 39, 41, 0.32)',
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
      },
    },
  },
  plugins: [],
}
