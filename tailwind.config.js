/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#E4DED2',
        paper: '#F8F5EE',
        ink: '#192326',
        slate: '#626D6E',
        mist: '#E5ECE8',
        cream: '#F0E9DB',
        sand: '#D8CFBE',
        line: '#D5CDBE',
        blue: '#315F65',
        navy: '#20373A',
        sage: '#718779',
        coral: '#A65D49',
        gold: '#9B7A48',
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', 'Georgia', '"Noto Serif SC"', '"Songti SC"', 'STSong', 'SimSun', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(25, 35, 38, 0.08)',
        float: '0 30px 80px -60px rgba(25, 35, 38, 0.5)',
      },
      borderRadius: {
        lg: '4px',
        md: '2px',
      },
      maxWidth: {
        app: '32rem',
        content: '1280px',
        copy: '640px',
      },
    },
  },
  plugins: [],
}
