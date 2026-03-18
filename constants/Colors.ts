export const colors = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#4DA3FF',
  
  // Secondary colors
  secondary: '#FF2D55',
  secondaryDark: '#CC0033',
  secondaryLight: '#FF6B8A',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#E5E5EA',
  
  // Text colors
  textPrimary: '#000000',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  textInverse: '#FFFFFF',
  
  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  
  // Border colors
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  
  // Platform colors
  spotify: '#1DB954',
  youtube: '#FF0000',
  
  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  transparent: 'transparent',
};

export type ColorKey = keyof typeof colors;

const tintColorLight = colors.primary;
const tintColorDark = colors.primaryLight;

// Expo template-compatible theme object (used by `components/Themed.tsx` and tab layout).
const Colors = {
  light: {
    text: colors.textPrimary,
    background: colors.background,
    tint: tintColorLight,
    icon: colors.textSecondary,
    tabIconDefault: colors.textTertiary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: colors.textInverse,
    background: '#000000',
    tint: tintColorDark,
    icon: '#CCCCCC',
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorDark,
  },
};

export default Colors;
