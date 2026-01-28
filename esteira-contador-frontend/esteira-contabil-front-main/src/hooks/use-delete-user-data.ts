import { deleteCookie } from 'cookies-next';
import { useCallback } from 'react';

const useDeleteUserData = () => {
	const deleteUserCookiesCallback = useCallback((cookieNames: string[]) => {
		deleteUserCookies(cookieNames);
	}, []);

	const deleteAllCookiesCallback = useCallback((exceptions: string[] = []) => {
		deleteAllCookies(exceptions);
	}, []);

	return {
		deleteUserCookies: deleteUserCookiesCallback,
		deleteAllCookies: deleteAllCookiesCallback,
	};
};

export const deleteUserCookies = (cookieNames: string[]) => {
	cookieNames.forEach((cookieName) => {
		deleteCookie(cookieName);
	});
};

export const deleteAllCookies = (exceptions: string[] = []) => {
	const cookies = document.cookie ? document.cookie.split('; ') : [];
	cookies.forEach((cookie) => {
		// Ignorar cookies vazios
		if (!cookie) return;

		const cookieName = cookie.split('=')[0];
		if (cookieName && !exceptions.includes(cookieName)) {
			deleteCookie(cookieName);
		}
	});
};

export default useDeleteUserData;
