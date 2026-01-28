import { useColorThemeContext } from '@/context/color-themes-context';
import { ColorTheme } from '@/hooks/use-color-theme';
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';

export const ThemeSelector: React.FC = () => {
	const { colorTheme, setColorTheme, availableThemes } = useColorThemeContext();

	return (
		<Select value={colorTheme} onValueChange={(e) => setColorTheme(e as ColorTheme)}>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Temas</SelectLabel>
					{availableThemes.map((theme) => (
						<SelectItem key={theme} value={theme}>
							{theme.charAt(0).toUpperCase() + theme.slice(1)}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
};
