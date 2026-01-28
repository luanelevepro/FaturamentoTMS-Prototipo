import { Toaster } from '@/components/ui/sonner';
import { ColorThemeProvider } from '@/context/color-themes-context';
import { CompanyContextProvider } from '@/context/company-context';
import { LayoutProvider } from '@/context/layout-context';
import '@/styles/globals.css';
import '@/styles/themes.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import { PagesTopLoader } from 'nextjs-toploader/pages';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false, // default: true
		},
	},
});

export default function App({ Component, pageProps: { ...pageProps } }: AppProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider attribute='class' disableTransitionOnChange defaultTheme='light' enableSystem>
				<CompanyContextProvider>
					<ColorThemeProvider>
						<LayoutProvider>
							<PagesTopLoader showSpinner={false} />
							<Component {...pageProps} />
							<Toaster richColors />
						</LayoutProvider>
					</ColorThemeProvider>
				</CompanyContextProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
