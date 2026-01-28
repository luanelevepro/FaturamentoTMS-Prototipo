import DashboardLayout from '@/components/layout/dashboard-layout';
import Head from 'next/head';
import CardsDash from './CardsDash';
import ChartAreaDash from './ChartArea';
import ChartBarDash from './ChartBar';
import Summary from './Summary';
import ConfigDialog from './ConfigDialog';

export const mockData1 = [
	{ date: 'Janeiro', meta: 1450000, realizado: 1100000 },
	{ date: 'Fevereiro', meta: 1150000, realizado: 1100000 },
	{ date: 'Março', meta: 170000, realizado: 1100000 },
	{ date: 'Abril', meta: 170000, realizado: 190000 },
	{ date: 'Maio', meta: 1330000, realizado: 1100000 },
	{ date: 'Junho', meta: 1000000, realizado: 1100000 },
];

export const mockData2 = [
	{ date: 'Janeiro', 2024: 70400, 2025: 52100 },
	{ date: 'Fevereiro', 2024: 70400, 2025: 52100 },
	{ date: 'Março', 2024: 70400, 2025: 52100 },
	{ date: 'Abril', 2024: 70400, 2025: 52100 },
	{ date: 'Maio', 2024: 70400, 2025: 52100 },
	{ date: 'Junho', 2024: 70400, 2025: 52100 },
];

export default function Dashboard() {
	return (
		<>
			<Head>
				<title>Dashboard</title>
			</Head>
			<DashboardLayout
				title='Dashboard'
				description='Bem-vindo ao seu painel! Acompanhe as métricas e desempenho da empresa.'
				rightSection={<ConfigDialog />}
			>
				<div className='grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3'>
					<CardsDash />

					<ChartAreaDash />

					<Summary />

					<ChartBarDash
						className='order-9 lg:col-span-2'
						title='Meta vc Realizado'
						data={mockData1}
						dataKeyX='date'
						colors={['var(--chart-8)', 'var(--chart-9)']}
					/>

					<ChartBarDash
						className='order-10 lg:col-span-2'
						title='Devoluções Mensais'
						data={mockData2}
						dataKeyX='date'
						colors={['var(--chart-10)', 'var(--chart-11)']}
					/>
				</div>
			</DashboardLayout>
		</>
	);
}
