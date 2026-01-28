import { ColorTheme, useColorTheme } from '@/hooks/use-color-theme';
import React, { createContext, ReactNode, useContext } from 'react';

interface ColorThemeContextType {
	colorTheme: ColorTheme;
	setColorTheme: (theme: ColorTheme) => void;
	availableThemes: readonly ColorTheme[];
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

interface ProviderProps {
	children: ReactNode;
}

export const ColorThemeProvider: React.FC<ProviderProps> = ({ children }) => {
	const { colorTheme, setColorTheme, availableThemes } = useColorTheme();
	return <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, availableThemes }}>{children}</ColorThemeContext.Provider>;
};

export function useColorThemeContext(): ColorThemeContextType {
	const context = useContext(ColorThemeContext);
	if (!context) {
		throw new Error('useColorThemeContext must be used within a ColorThemeProvider');
	}
	return context;
}
