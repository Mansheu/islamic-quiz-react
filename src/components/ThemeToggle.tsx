import React, { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'islamic-quiz-theme';

const applyTheme = (theme: 'dark' | 'light') => {
  const body = document.body;
  const root = document.documentElement;

  body.classList.toggle('dark', theme === 'dark');
  body.setAttribute('data-theme', theme);
  root.setAttribute('data-theme', theme);
};

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme: 'dark' | 'light' = savedTheme === 'dark' || (!savedTheme && prefersDark)
      ? 'dark'
      : 'light';

    setIsDark(theme === 'dark');
    applyTheme(theme);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const nextTheme: 'dark' | 'light' = prev ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      return !prev;
    });
  };

  return (
    <div className="theme-toggle">
      <button 
        className="theme-btn" 
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          {isDark ? (
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          ) : (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          )}
        </svg>
      </button>
      <span>Theme</span>
    </div>
  );
};

export default ThemeToggle;