/** Design tokens for programmatic access (charts, dynamic styles, etc.) */
export const designTokens = {
  colors: {
    primary: { h: 234, s: 89, l: 60 },
    accent: { h: 172, s: 66, l: 50 },
    destructive: { h: 0, s: 84, l: 60 },
    success: { h: 160, s: 84, l: 39 },
    warning: { h: 38, s: 92, l: 50 },
  },

  /** Convert HSL token to CSS string */
  hsl(color: { h: number; s: number; l: number }, alpha = 1): string {
    return alpha < 1
      ? `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha})`
      : `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
  },

  /** Compliance score colors */
  scoreColor(score: number): string {
    if (score >= 91) return designTokens.hsl(designTokens.colors.primary);
    if (score >= 71) return designTokens.hsl(designTokens.colors.success);
    if (score >= 41) return designTokens.hsl(designTokens.colors.warning);
    return designTokens.hsl(designTokens.colors.destructive);
  },

  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
} as const;
