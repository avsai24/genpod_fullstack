import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D1117',
        surface: '#161B22',
        foreground: '#F5F7FA',
        accent: '#14B8A6',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0, 0, 0, 0.1)',
        subtle: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
export default config