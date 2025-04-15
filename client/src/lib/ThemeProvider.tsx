
import { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#0097FB',
  secondaryColor: '#97fb00'
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <ThemeContext.Provider value={{
      primaryColor: theme === 'dark' ? 'hsl(142, 76%, 73%)' : 'hsl(204, 100%, 49%)',
      secondaryColor: theme === 'dark' ? 'hsl(142, 71%, 45%)' : 'hsl(84, 100%, 49%)',
      accentColor: theme === 'dark' ? 'hsl(316, 73%, 52%)' : 'hsl(316, 100%, 49%)',
      theme,
      setTheme
    }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
