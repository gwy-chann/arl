/**
 * Zero-FOUC (Flash of Unstyled Content) Pre-DOM-Paint Inline Script
 *
 * Runs synchronously in document <head> before <body> is painted.
 * Evaluates 'arlq-theme' in localStorage (or system preference if auto)
 * and applies data-theme="dark" and .dark class immediately to <html>.
 */
export function ThemeScript() {
  const code = `(function(){
  try {
    var stored = localStorage.getItem('arlq-theme') || 'auto';
    var isDark = stored === 'auto'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : stored === 'dark';
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

