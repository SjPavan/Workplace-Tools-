'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
