import { Platform, StyleSheet } from 'react-native';

// ═══════════════════════════════════════════════════════
//  ROADSAFE — Global Design Tokens & Reusable Styles
// ═══════════════════════════════════════════════════════

// ─── Color Palette ───────────────────────────────────
export const COLORS = {
    // Primary
    emerald: '#2D7A4D',
    emeraldDark: '#1B5E20',
    emeraldLight: '#4CAF50',

    // Backgrounds
    bgPrimary: '#F0F7F2',
    bgCard: '#FFFFFF',
    bgInput: '#F7FAF8',
    bgScreen: '#F0F7F2',

    // Text
    textPrimary: '#1A1A2E',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    textWhite: '#FFFFFF',
    textEmerald: '#2D7A4D',

    // Accents
    accentOrange: '#FF6B35',
    accentBlue: '#3B82F6',
    accentRed: '#EF4444',
    accentSky: '#0EA5E9',
    accentYellow: '#F59E0B',

    // Borders & Dividers
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    divider: '#E8ECE9',

    // Gradients (typed as readonly tuples for expo-linear-gradient)
    gradientEmerald: ['#2D7A4D', '#1B5E20'] as readonly [string, string],
    gradientOrangeRed: ['#FF6B35', '#E63946'] as readonly [string, string],
    gradientBlue: ['#3B82F6', '#1D4ED8'] as readonly [string, string],
    gradientSky: ['#0EA5E9', '#0284C7'] as readonly [string, string],
    gradientBg: ['#F0F7F2', '#E8F5E9'] as readonly [string, string],

    // Misc
    shadow: '#2D7A4D',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// ─── Spacing Scale ───────────────────────────────────
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// ─── Border Radius ───────────────────────────────────
export const RADIUS = {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 25,
    pill: 50,
    circle: 999,
};

// ─── Typography ──────────────────────────────────────
export const FONT = {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
};

export const FONT_SIZE = {
    caption: 12,
    small: 13,
    body: 15,
    bodyLg: 16,
    subtitle: 18,
    title: 22,
    heading: 26,
    hero: 32,
};

// ─── Shadow Presets ──────────────────────────────────
export const SHADOWS = {
    card: Platform.select({
        ios: {
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
        },
        android: {
            elevation: 4,
        },
    }),
    cardHeavy: Platform.select({
        ios: {
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
        },
        android: {
            elevation: 8,
        },
    }),
    fab: Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
        },
        android: {
            elevation: 10,
        },
    }),
    soft: Platform.select({
        ios: {
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
        },
        android: {
            elevation: 2,
        },
    }),
};

// ─── Reusable Styles ─────────────────────────────────
export const GLOBAL = StyleSheet.create({
    // Screen container
    screen: {
        flex: 1,
        backgroundColor: COLORS.bgScreen,
    },

    // Card
    card: {
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        ...SHADOWS.card,
    },

    // Section title
    sectionTitle: {
        fontSize: FONT_SIZE.subtitle,
        fontWeight: FONT.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },

    // Floating-label-style input wrapper
    inputWrapper: {
        backgroundColor: COLORS.bgInput,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.lg,
        paddingVertical: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
        marginBottom: SPACING.lg,
    },

    // Input text
    inputText: {
        fontSize: FONT_SIZE.bodyLg,
        color: COLORS.textPrimary,
    },

    // Floating label (sits above input)
    floatingLabel: {
        fontSize: FONT_SIZE.caption,
        fontWeight: FONT.semiBold,
        color: COLORS.emerald,
        marginBottom: SPACING.xs,
    },

    // Primary gradient button (use with LinearGradient)
    gradientButton: {
        borderRadius: RADIUS.xl,
        paddingVertical: SPACING.lg,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },

    gradientButtonText: {
        color: COLORS.textWhite,
        fontSize: FONT_SIZE.bodyLg,
        fontWeight: FONT.bold,
        letterSpacing: 0.5,
    },

    // Row utilities
    row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },

    rowBetween: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
    },

    // Center utility
    center: {
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
});
