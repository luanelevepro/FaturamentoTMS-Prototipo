import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useColorThemeContext } from '@/context/color-themes-context';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

export default function AppearancePage() {
	const { colorTheme, setColorTheme, availableThemes } = useColorThemeContext();
	const { resolvedTheme } = useTheme();

	return (
		<>
			<Head>
				<title>Dashboard | Esteira</title>
			</Head>
			<DashboardLayout title='Configurações' description='Personalize a aparência do sistema.'>
				<Card>
					<CardHeader>
						<CardTitle>Aparência</CardTitle>

						<CardDescription>Personalize a aparência do sistema.</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-1'>
							<RadioGroup onValueChange={setColorTheme} value={colorTheme} className='flex flex-wrap pt-2'>
								{availableThemes.map((color) => (
									<Label
										key={color}
										className='[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:text-primary w-full flex-1 cursor-pointer'
									>
										<RadioGroupItem value={color} className='sr-only' id={`radio-${color}`} />
										<Badge
											variant={'outline'}
											id={color}
											className={`${color} ${resolvedTheme == 'dark' ? 'dark' : ''} bg-primary/20 border-primary/20 w-full min-w-20 items-center rounded-sm`}
										>
											<div className={`bg-primary size-3 rounded-full ${colorTheme === color ? 'hidden' : ''} `}></div>
											<Check className={`${colorTheme === color ? '' : 'hidden'} size-3`} />
											<p className='flex flex-1 justify-center'>{color.charAt(0).toUpperCase() + color.slice(1)}</p>
										</Badge>
									</Label>
								))}
							</RadioGroup>
						</div>
					</CardContent>
				</Card>
			</DashboardLayout>
		</>
	);
}
