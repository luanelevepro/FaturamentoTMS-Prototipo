'use client';

import { CartesianGrid, Line, LineChart, TooltipProps, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { format, startOfYear } from 'date-fns';

const chartData = [
	{ month: '01/08', meta: 911186, saldo: 111480 },
	{ month: '02/08', meta: 900000.0, saldo: 670000.0 },
	{ month: '03/08', meta: 1150000.0, saldo: 1400000.0 },
	{ month: '04/08', meta: 850000.0, saldo: 132000.0 },
	{ month: '05/08', meta: 1050000, saldo: 130 },
	{ month: '06/08', meta: 214, saldo: 140 },
];
const chartConfig = {
	meta: {
		label: 'meta',
		color: 'var(--chart-6)',
	},
	saldo: {
		label: 'saldo',
		color: 'var(--chart-7)',
	},
} satisfies ChartConfig;

interface CustomTooltipProps extends TooltipProps<number, string> {
	payload?: Array<{
		value: number;
		name: string;
		color: string;
		payload: string | number;
	}>;
}

const CustomTooltip = ({ payload }: CustomTooltipProps) => {
	if (!payload || !payload.length) return null;
	return (
		<div className='flex min-w-[150px] flex-col gap-1 rounded bg-white p-2 shadow-md'>
			{payload.map((item, index: number) => (
				<div key={index} className='flex items-center gap-1'>
					<span className='inline-block size-2.5 rounded-full' style={{ backgroundColor: item.color }} />
					<div>
						<p className='text-sm text-[13px] text-[#707070] capitalize'>{item.name}</p>
						<p className='text-sm font-semibold text-[#171717]'>
							{item.value.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
						</p>
					</div>
				</div>
			))}
		</div>
	);
};

export default function ChartAreaDash() {
	const today = new Date();
	const firstDayOfYear = startOfYear(today);
	return (
		<div className='order-8 lg:col-span-2 xl:order-7'>
			<Card className='shadow-none'>
				<CardHeader className='gap-0'>
					<div className='flex justify-between'>
						<p className='font-semibold'>Faturamento vs meta diária</p>
						<div className='flex gap-4'>
							{(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
								<div key={key} className='flex items-center gap-2'>
									<span className='inline-block size-2.5 rounded-full' style={{ backgroundColor: chartConfig[key].color }} />
									<p className='text-sm text-[#707070] capitalize'>{chartConfig[key].label}</p>
								</div>
							))}
						</div>
					</div>
					<p className='text-sm text-[#707070]'>
						({format(firstDayOfYear, 'dd/MM/yyyy')} - {format(today, 'dd/MM/yyyy')})
					</p>
				</CardHeader>
				<CardContent className='pr-4'>
					<ChartContainer config={chartConfig} className='max-h-[258px] w-full'>
						<LineChart
							accessibilityLayer
							data={chartData}
							margin={{
								left: -12,
								right: 10,
								top: 10,
								bottom: 30,
							}}
						>
							<CartesianGrid strokeWidth={1} stroke='var(--chart-grid)' />
							<YAxis
								tickLine={false}
								axisLine={false}
								tickCount={9}
								className='capitalize'
								tickFormatter={(value, index) => {
									if (index % 2 === 0) {
										return value.toLocaleString('en-US', {
											notation: 'compact',
											maximumFractionDigits: 2,
										});
									}
									return '';
								}}
							/>

							<XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={14} tickFormatter={(value) => value} />
							<ChartTooltip cursor={false} content={<CustomTooltip />} />
							{(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
								<Line
									key={key}
									dataKey={key}
									type='monotone'
									stroke={chartConfig[key].color}
									strokeWidth={3}
									dot={({ cx, cy }) => {
										const outerRadius = 7;
										const innerRadius = 5;

										return (
											<g key={cx + cy}>
												<circle cx={cx} cy={cy} r={outerRadius} fill={chartConfig[key].color} />
												<circle cx={cx} cy={cy} r={innerRadius} className='fill-white dark:fill-black' />
											</g>
										);
									}}
									activeDot
								/>
							))}
						</LineChart>
					</ChartContainer>
				</CardContent>
			</Card>
		</div>
	);
}
