const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#1A1A1A',
        input: '#121212',
        textPrimary: '#E5E5E5',
        textSecondary: '#A1A1AA',
        border: '#2A2A2A',
        accent: '#3B82F6',
        accentHover: '#0d9488',
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0, 0, 0, 0.1)',
        subtle: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  safelist: [
    'hover:bg-accentHover',
  ],
  plugins: [],
}
export default config  