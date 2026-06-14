/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF7EC',
        ink: '#3A3142',
        inksoft: '#6B6273',
        grape: '#6D4BE0',
        graped: '#5435C4',
        bubblegum: '#FF4D87',
        bubbled: '#E22C68',
        sunny: '#FFD42E',
        sunnyd: '#E9B400',
        tangerine: '#FF7A2F',
        tanged: '#E0590F',
        mint: '#16BFA6',
        mintd: '#0E9B86',
        butter: '#FFF3D6',
        blush: '#FFE3EC',
        lilac: '#E7E0FF',
        sky: '#DDEFFF',
        sage: '#DFF6E8',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'cursive'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
