/**
 * SymptaCare Design Tokens
 *
 * Single source of truth for all colors, spacing, radii, shadows,
 * and typography used across the application.
 *
 * DO NOT hardcode these values inside components.
 * Import from this file instead.
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Color Palette
// ---------------------------------------------------------------------------

export const COLORS = {

  // ── Brand (derived from SymptaCare logo) ─────────────────────────────────────
  brandNavy:        '#263248',   // Deep logo navy (stethoscope core)
  brandBlue:        '#599ED6',   // Sky blue (legible version of stethoscope top)
  brandBlueLight:   '#9CCAE9',   // Light sky blue (stethoscope top exact)
  brandCyan:        '#38BDF8',   // Cyan — interactive highlights
  brandGreen:       '#10B981',   // SymptaCare green — primary CTA
  brandMint:        '#A3E4B8',   // Pastel mint (logo sparkles)
  brandGreenDark:   '#059669',   // Darker green — pressed states

  // ── Backgrounds ───────────────────────────────────────────────────────────
  bgPrimary:        '#F6F8FB',   // Very soft blue/grey-white matching logo background
  bgSurface:        '#F0FDF4',   // Solid soft mint-white (Tailwind green-50)
  bgSurface2:       '#DCFCE7',   // Solid slightly darker mint (Tailwind green-100)
  bgOverlay:        'rgba(38, 50, 72, 0.05)', // Subtle hover tint

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary:      '#263248',   // Deep navy — headings, primary labels
  textSecondary:    '#475569',   // Mid gray — body copy
  textMuted:        '#94A3B8',   // Muted — subtitles, metadata, hints
  textOnGreen:      '#FFFFFF',   // Text on green backgrounds
  textOnNavy:       '#FFFFFF',   // Text on navy backgrounds

  // ── Borders ───────────────────────────────────────────────────────────────
  borderLight:      '#E2E8F0',   // Neutral card borders
  borderBrand:      '#BFDBFE',   // Blue-tinted brand border

  // ── Triage States (reserved for triage communication ONLY) ─────────────────
  triageGreenBg:    '#F0FDF4',
  triageGreenText:  '#15803D',
  triageGreenBorder:'#86EFAC',
  triageGreenIcon:  '#22C55E',

  triageAmberBg:    '#FFFBEB',
  triageAmberText:  '#92400E',
  triageAmberBorder:'#FCD34D',
  triageAmberIcon:  '#F59E0B',

  triageRedBg:      '#FFF1F2',
  triageRedText:    '#9F1239',
  triageRedBorder:  '#FDA4AF',
  triageRedIcon:    '#F43F5E',

  // ── Functional ────────────────────────────────────────────────────────────
  error:            '#DC2626',
  errorBg:          '#FEF2F2',
  success:          '#10B981',
  warning:          '#F59E0B',
};

// ---------------------------------------------------------------------------
// Spacing Scale
// ---------------------------------------------------------------------------

export const SPACING = {
  xs:    4,
  sm:    8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  pill: 9999,
};

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const SHADOW = {
  sm: {
    shadowColor:   '#1A3A6C',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  3,
    elevation:     1,
  },
  md: {
    shadowColor:   '#1A3A6C',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  12,
    elevation:     3,
  },
  lg: {
    shadowColor:   '#1A3A6C',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius:  24,
    elevation:     5,
  },
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const TYPOGRAPHY = {
  fontFamily: {
    primary: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    mono:    Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  size: {
    xs:   11,   // Legal text, footnotes
    sm:   13,   // Labels, captions, badges
    base: 15,   // Body text
    md:   17,   // Large body, subheadings
    lg:   20,   // Section titles
    xl:   24,   // Card titles
    xxl:  28,   // Page headings
    hero: 36,   // Welcome hero title
  },
  weight: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};


