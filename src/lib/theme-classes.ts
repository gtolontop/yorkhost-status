// Centralized theme classes for consistent styling across light and dark modes

export const themeClasses = {
  // Backgrounds
  bg: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    card: 'bg-white dark:bg-gray-800',
    modal: 'bg-white dark:bg-gray-900',
  },

  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    tertiary: 'text-gray-500 dark:text-gray-500',
    muted: 'text-gray-400 dark:text-gray-600',
    inverse: 'text-white dark:text-gray-900',
  },

  // Borders
  border: {
    default: 'border-gray-200 dark:border-gray-700',
    light: 'border-gray-100 dark:border-gray-800',
    strong: 'border-gray-300 dark:border-gray-600',
  },

  // Components
  button: {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
    danger: 'bg-danger text-white hover:bg-danger-dark',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  },

  // Inputs
  input: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-primary',

  // Cards
  card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',

  // Status colors (same for both themes)
  status: {
    operational: 'text-green-500',
    degraded: 'text-yellow-500',
    down: 'text-red-500',
    maintenance: 'text-blue-500',
  },

  // Badges
  badge: {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  },
};

// Helper function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}