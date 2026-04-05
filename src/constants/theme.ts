/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// ── Command design tokens ─────────────────────────────────────────────────────

export const colors = {
    bg: {
        primary: '#FFFFFF',       // white — home/list screens
        card: '#FFFFFF',          // white surface — cards, list icon bg
        muted: '#F2F2F2',         // light gray — search bar, inputs
        recording: '#0D0D0D',     // dark — recording/detail screen
    },
    text: {
        primary: '#0D0D0D',
        secondary: '#888888',
        heading: '#555555',
        placeholder: '#BBBBBB',
        disabled: '#CCCCCC',
    },
    accent: {
        primary: '#B08F9A',       // warm mauve
        primaryBg: '#EDE0E5',     // soft mauve bg
        dark: '#8C6E79',          // dark mauve
    },
    border: {
        subtle: '#F0F0F0',
        default: '#E8E8E8',
    },
    white: '#FFFFFF',
    black: '#0D0D0D',
} as const

export const font = {
    family: {
        regular: 'Geist-Regular',
        medium: 'Geist-Medium',
        semiBold: 'Geist-SemiBold',
        bold: 'Geist-Bold',
        black: 'Geist-Black',
    },
    size: {
        xs: 11,
        sm: 12,
        md: 15,
        lg: 17,
        xl: 24,
        display: 34,
        hero: 42,
    },
} as const

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
} as const

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
} as const
