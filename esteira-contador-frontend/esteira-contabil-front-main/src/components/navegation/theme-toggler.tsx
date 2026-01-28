import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import Head from 'next/head';

export default function ThemeToggler() {
	const { resolvedTheme, setTheme } = useTheme();

	return (
		<>
			<Head>
				<meta name='theme-color' content={resolvedTheme === 'dark' ? 'black' : 'white'} />
			</Head>
			<Button
				variant='ghost'
				size='icon'
				onClick={() => {
					setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
				}}
			>
				<Moon className='hidden h-6 w-6 dark:block' />
				<Sun className='h-6 w-6 dark:hidden' />
			</Button>
		</>
	);
}
