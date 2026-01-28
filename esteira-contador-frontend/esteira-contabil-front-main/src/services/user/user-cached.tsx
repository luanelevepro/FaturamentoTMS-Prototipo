import { getCookie, setCookie } from 'cookies-next';
import { createClient } from '@/utils/supabase/component';

const CACHE_DURATION_MINUTES = 2;
const supabase = createClient();

export async function getUserCached() {
	const timeUserCache = await resolveCookie('TIME_USER_CACHE');
	const cachedUser = await resolveCookie('USER_CACHE');

	if (timeUserCache && isCacheValid(timeUserCache)) {
		if (cachedUser) {
			try {
				return JSON.parse(cachedUser);
			} catch (error) {
				console.error('Erro ao parsear o usuário do cache:', error);
			}
		}
	}

	const user = await requestUser();
	if (user) {
		updateUserCache(user);
	}
	return user;
}

export async function getUserIdCached() {
	const { user } = await getUserCached();
	return user?.id;
}

function isCacheValid(timeUserCache: string): boolean {
	const cookieDate = new Date(timeUserCache);
	const currentDate = new Date();

	if (isNaN(cookieDate.getTime()) || isNaN(currentDate.getTime())) {
		return false;
	}

	const diffInMinutes = (currentDate.getTime() - cookieDate.getTime()) / (1000 * 60);
	return diffInMinutes <= CACHE_DURATION_MINUTES;
}

async function requestUser(): Promise<Record<string, unknown> | null> {
	try {
		const { data, error } = await supabase.auth.getUser();
		if (error) {
			throw new Error(error.message || 'Erro ao obter usuário.');
		}
		return data || null;
	} catch (error) {
		console.error('Erro ao carregar o usuário:', error);
		return null;
	}
}

function updateUserCache(user: Record<string, unknown>) {
	const currentDate = new Date().toISOString();
	setCookie('TIME_USER_CACHE', currentDate);
	setCookie('USER_CACHE', JSON.stringify(user));
}

async function resolveCookie(key: string): Promise<string | undefined> {
	const cookie = getCookie(key);
	return cookie instanceof Promise ? await cookie : (cookie as string | undefined);
}
