// theme.config.ts

export const themeConfig = {
  // Brand colors that can be modified to change the theme across the entire application
  colors: {
    primary: '#0bf5a3ff', // Amber-500 (Gold/Yellow theme default)
    secondary: '#1e293b', // Slate-800
    background: '#020617', // Slate-950 (Dark mode background)
    text: '#f8fafc', // Slate-50
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    dark: '#0f172a', // Slate-900
    darkBackground: '#020617', // Slate-950 (Dark mode background)
    darkText: '#f8fafc', // Slate-50
    darkGlassBorder: 'rgba(255, 255, 255, 0.1)',
    light: '#020617', // Slate-950 (Dark mode background)
    lightBackground: '#020617', // Slate-950 (Dark mode background)
    lightText: '#f8fafc', // Slate-50
    lightGlassBorder: 'rgba(255, 255, 255, 0.1)',
  },

  // Brand identity
  branding: {
    systemName: 'Al-Kabeer Pakwaan',
    tagline: 'Premium Catering Services',
    logoUrl: '/logo.jpg', // Add a logo.png to /public folder and change path here
  },

  // Multi-Language Support Options (En / Ur)
  defaultLanguage: 'en',

  // Theme Options (Light / Dark)   
  defaultTheme: 'light',
};
