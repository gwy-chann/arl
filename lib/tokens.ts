/**
 * ARLQ Inventory & Sales Design System Tokens
 * Source of truth extracted directly from mockup/styles.css and mockup/index.html
 */

export type ThemeMode = 'light' | 'dark';

export interface ColorTokens {
  surfaces: {
    base: string;
    surface: string;
    card: string;
    sidebar: string;
    input: string;
    hover: string;
    muted: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    light: string;
  };
  brand: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryBorder: string;
    secondary: string;
    secondaryHover: string;
  };
  status: {
    success: {
      main: string;
      light: string;
      border: string;
    };
    accent: {
      main: string;
      light: string;
      border: string;
    };
    danger: {
      main: string;
      light: string;
      border: string;
    };
    info: {
      main: string;
      light: string;
      border: string;
    };
  };
  borders: {
    default: string;
    subtle: string;
    focus: string;
  };
  charts: {
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    info: string;
    neutral: string;
    grid: string;
  };
}

export const LIGHT_THEME_TOKENS: ColorTokens = {
  surfaces: {
    base: '#F7F7F4',      // --bg: warm off-white canvas
    surface: '#FFFFFF',   // --surface: elevated white card / modal / sidebar
    card: '#FFFFFF',      // .card surface
    sidebar: '#FFFFFF',   // .sidebar background
    input: '#FFFFFF',     // input surface
    hover: '#FAFAF8',     // --sunken: subtle interactive row/button hover
    muted: '#FAFAF8',     // toolbar, table header/footer, receipt wrapper
  },
  text: {
    primary: '#1F2933',   // --ink: deep slate primary typography & headings
    secondary: '#3E4A56', // --ink-2: body text & table cell content
    muted: '#6B7280',     // --muted: metadata, hints, breadcrumbs
    light: '#FFFFFF',     // white text for contrast on brand surfaces
  },
  brand: {
    primary: '#095B06',       // --brand: rich forest green
    primaryHover: '#0B6E07',  // --brand-h: interactive hover
    primaryLight: '#EAF2E8',  // --brand-soft: soft green badge / active nav tint
    primaryBorder: '#095B06', // primary button border
    secondary: '#FFFFFF',     // .btn.sec background
    secondaryHover: '#FAFAF8',// .btn.sec hover background
  },
  status: {
    success: {
      main: '#095B06',       // --ok
      light: '#EAF2E8',      // --ok-bg
      border: '#C8DFC5',     // --ok-border
    },
    accent: {
      main: '#B45309',       // --warn (warning amber)
      light: '#FEF3C7',      // --warn-bg
      border: '#FCE69B',     // --warn-border
    },
    danger: {
      main: '#B42318',       // --bad (crimson red)
      light: '#FDECEA',      // --bad-bg
      border: '#F8C9C4',     // --bad-border
    },
    info: {
      main: '#475569',       // --info (slate blue)
      light: '#EEF2F6',      // --info-bg
      border: '#D7DFE8',     // --info-border
    },
  },
  borders: {
    default: '#E4E4DF',   // --line: default card, table, divider border
    subtle: '#CFCFC8',    // --line-2: input, toggle, secondary button border
    focus: '#095B06',     // brand focus ring
  },
  charts: {
    primary: '#095B06',
    secondary: '#3E4A56',
    accent: '#B45309',
    danger: '#B42318',
    info: '#475569',
    neutral: '#CFCFC8',
    grid: '#E4E4DF',
  },
};

export const DARK_THEME_TOKENS: ColorTokens = {
  surfaces: {
    base: '#111827',                     // --bg: deep slate canvas
    surface: '#1F2937',                  // --surface: elevated slate card/sidebar
    card: '#1F2937',                     // .card surface
    sidebar: '#1F2937',                  // .sidebar surface
    input: '#111827',                    // dark mode input background
    hover: '#283548',                    // dark mode table/row hover
    muted: '#16202E',                    // --sunken: sunken dark slate toolbar/footer
  },
  text: {
    primary: '#FFFFFF',                  // --ink: pure white typography
    secondary: '#E5E7EB',                // --ink-2: slate 200 readable body text
    muted: '#9CA3AF',                    // --muted: slate 400 captions & hints
    light: '#FFFFFF',                    // pure white high contrast
  },
  brand: {
    primary: '#22C55E',                  // --brand: vibrant emerald green
    primaryHover: '#4ADE80',             // --brand-h: lighter emerald hover
    primaryLight: 'rgba(34, 197, 94, 0.18)', // --brand-soft: soft emerald tint
    primaryBorder: '#4ADE80',            // bright emerald button border
    secondary: '#374151',                // .btn.sec background
    secondaryHover: '#4B5563',           // .btn.sec hover background
  },
  status: {
    success: {
      main: '#4ADE80',                   // --ok: bright emerald
      light: 'rgba(34, 197, 94, 0.22)',  // --ok-bg
      border: 'rgba(34, 197, 94, 0.45)', // --ok-border
    },
    accent: {
      main: '#FBBF24',                   // --warn: warm amber
      light: 'rgba(245, 158, 11, 0.22)', // --warn-bg
      border: 'rgba(245, 158, 11, 0.45)',// --warn-border
    },
    danger: {
      main: '#F87171',                   // --bad: bright coral red
      light: 'rgba(239, 68, 68, 0.22)',  // --bad-bg
      border: 'rgba(239, 68, 68, 0.45)', // --bad-border
    },
    info: {
      main: '#9CA3AF',                   // --info: slate gray
      light: 'rgba(156, 163, 175, 0.20)',// --info-bg
      border: 'rgba(156, 163, 175, 0.40)',// --info-border
    },
  },
  borders: {
    default: '#374151',                  // --line: slate 700 divider/card border
    subtle: '#4B5563',                   // --line-2: slate 600 input/toggle border
    focus: '#22C55E',                    // emerald focus ring
  },
  charts: {
    primary: '#22C55E',
    secondary: '#E5E7EB',
    accent: '#FBBF24',
    danger: '#F87171',
    info: '#9CA3AF',
    neutral: '#4B5563',
    grid: '#374151',
  },
};

/**
 * Typography and metrics tokens from the mockup
 */
export const TYPOGRAPHY_TOKENS = {
  fontFamilies: {
    sans: "Figtree, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'Courier Prime', 'Courier New', monospace",
  },
  radii: {
    sm: '4px',
    md: '6px', // mockup --r
    lg: '8px', // mockup card radius
    xl: '12px', // mockup login card radius
    full: '9999px', // mockup badge/pill radius
  },
  sidebarWidth: '260px', // mockup --sidebar
};

/**
 * Helper to retrieve exact theme tokens for runtime calculations, charts,
 * canvas drawings, or SVG elements based on mode.
 */
export function getThemeTokens(mode: ThemeMode = 'light'): ColorTokens {
  return mode === 'dark' ? DARK_THEME_TOKENS : LIGHT_THEME_TOKENS;
}

export default getThemeTokens;
