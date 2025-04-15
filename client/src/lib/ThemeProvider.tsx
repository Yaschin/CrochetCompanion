
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
  return (
    <ThemeContext.Provider value={{
      primaryColor: '#0097FB',
      secondaryColor: '#97fb00'
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
