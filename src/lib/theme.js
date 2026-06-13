// theme.js
// Centralized theme object containing all semantic color variables
// You can import this file wherever you need to access these exact hex codes in JS/TS.

const theme = {
  colors: {
    brand: {
      primary: "#4A89F3",    // Header, buttons, active tabs
      navy: "#203159",       // Sidebar, dark text, borders
    },
    background: {
      primary: "#E8EDFC",    // App Background (Light gradient/base)
      secondary: "#F4F6FE",  // Secondary Background (Hover states, subtle areas)
    },
    surface: {
      card: "#FFFFFF",       // Widget backgrounds
    },
    text: {
      primary: "#333333",    // Main body copy, prominent text
      secondary: "#8898AA",  // Descriptions, meta text, inactive elements
    },
    accent: {
      purple: "#7C58C8",     // Badges, tags, specific chart items
      orange: "#FFB84D",     // Warnings, notifications, highlights
      success: "#A5D6A7",    // Success states, positive growth
      pink: "#FF94C2",       // Secondary highlights, chart colors
      cyan: "#64B5F6",       // Interactive accents, chart colors
    }
  }
};

export default theme;
