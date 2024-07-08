/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        'poppins': ["Poppins", 'sans-serif'],
        'inter':  ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
      },
      lineHeight: {
        '11': '2.75rem',
      },
      colors: {
        gradientStart: '#2E28A5',
        gradientEnd: '#FAAA98',
        gradientMiddle: '#C88A9B',
        buttonShadow: '0px 7px 29px rgba(100, 100, 111, 0.2)',

        //dark mode
        darkBackground: '#070a18',
        darkText: '#FFFFFF',
        darkBlue:"#5B62FE",
        darkTextSecondary:"#cdced1",
        darkTextSecondary1:"#8CC0D7",
        darkEllipse:'#2A1F9D',
        darkFAQBackground:'#29283B',
        darkFAQBackground2:'#191825',
        currentFAQBackground: '#59588D',
        darkOverlayBackground:'#252347',
        // custom gradient colors
        darkGradientStart: 'rgba(13, 18, 60, 0.5)',
        darkGradientEnd: 'rgba(39, 35, 79, 0.5)',
        textGradientStart: '#4659CF',
        textGradientEnd: '#C562BD',

      },
      placeholderColor: ['responsive', 'focus', 'hover'], 
      keyframes: {
        fadeInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(60px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
      animation: {
        fadeInRight: 'fadeInRight 2s ease forwards',
      },
      screens: {
        sxxs: "255px",
        sxs: "265px",
        sxs1: "275px",
        sxs2: "285px",
        sxs3: "295px",
        ss: "305px",
        ss1: "315px",
        ss2: "325px",
        ss3: "335px",
        ss4: "345px",
        dxs: "375px",
        xxs: "405px",
        xxs1: "425px",
        sm1: "480px",
        sm4: "508px",
        sm2: "538px",
        sm3: "550px",
        sm: "640px",
        md: "768px",
        md1: "870px",
        md2: "914px",
        md3: "936px",
        lg: "976px",
        dlg: "1024px",
        dlg1:"1028px",
        lg1: "1100px",
        lgx: "1134px",
        dxl: "1280px",
        dxl1: "1380px",
        xl: "1440px",
        xl2: "1600px",
        xl3: "1920px",
        xl4: "2560px",
        xl5: "3840px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animated"),
  ],
};

