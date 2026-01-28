import { useState, useEffect } from 'react';
import { setCookie } from 'cookies-next';

const COOKIE_NAME = 'USER_COLOR_PREFERENCE' as const;
export const AVAILABLE_THEMES = ['zinc', 'purple', 'yellow', 'blue', 'green', 'orange', 'red', 'pink', 'cyberpunk', 'rose', 'night', 'aqua', 'sun'] as const;
export type ColorTheme = (typeof AVAILABLE_THEMES)[number];

function getInitialTheme(): ColorTheme {
	if (typeof document !== 'undefined') {
		const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
		if (match) {
			const value = match[1];
			if (AVAILABLE_THEMES.includes(value as ColorTheme)) {
				return value as ColorTheme;
			}
		}
	}
	return AVAILABLE_THEMES[0];
}

export function useColorTheme() {
	const [colorTheme, setColorTheme] = useState<ColorTheme>(getInitialTheme);

	// Aplica classe e persiste no cookie sempre que colorTheme mudar
	useEffect(() => {
		const html = document.documentElement;
		AVAILABLE_THEMES.forEach((theme) => html.classList.remove(theme));
		html.classList.add(colorTheme);

		setCookie(COOKIE_NAME, colorTheme, {
			maxAge: 60 * 60 * 24 * 365,
			path: '/',
		});
	}, [colorTheme]);

	return { colorTheme, setColorTheme, availableThemes: AVAILABLE_THEMES } as const;
}
