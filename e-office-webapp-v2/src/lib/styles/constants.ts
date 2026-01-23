/**
 * Design System Constants
 * Standarisasi styling untuk semua komponen PKL
 */

export const designTokens = {
  colors: {
    primary: {
      DEFAULT: '#0079BD',
      hover: '#0066A0',
      light: '#E6F4F8',
      dark: '#005A8A',
    },
    secondary: {
      DEFAULT: '#6B7280',
      hover: '#4B5563',
      light: '#F3F4F6',
    },
    success: {
      DEFAULT: '#16A34A',
      light: '#F0FDF4',
    },
    error: {
      DEFAULT: '#EF4444',
      light: '#FEE2E2',
    },
    warning: {
      DEFAULT: '#F59E0B',
      light: '#FEF3C7',
    },
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
  },
  typography: {
    fontFamily: {
      sans: 'var(--font-inter)',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
  },
} as const;
