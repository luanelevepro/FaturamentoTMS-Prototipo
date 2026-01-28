import { createServerClient, serializeCookieHeader } from '@supabase/ssr';
import { type NextApiRequest, type NextApiResponse } from 'next';
import type { CookieOptions } from '@supabase/ssr';

type CookieToSet = {
	name: string;
	value: string;
	options: CookieOptions;
};

export default function createClient(req: NextApiRequest, res: NextApiResponse) {
	const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll() {
				return Object.keys(req.cookies).map((name) => ({ name, value: req.cookies[name] || '' }));
			},
			setAll(cookiesToSet: CookieToSet[]) {
				res.setHeader(
					'Set-Cookie',
					cookiesToSet.map(({ name, value, options }) => serializeCookieHeader(name, value, options)),
				);
			},
		},
	});

	return supabase;
}
