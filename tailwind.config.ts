import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea',
          dark: '#5a67d8',
        },
        secondary: '#764ba2',
        success: '#48bb78',
        danger: '#f56565',
        warning: '#ed8936',
      },
      boxShadow: {
        xl2: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        lg: '12px',
      },
    },
  },
  plugins: [],
};

export default config;


