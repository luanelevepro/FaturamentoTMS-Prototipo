'use client';

import { Bar, BarChart, CartesianGrid, TooltipProps, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { format, startOfYear } from 'date-fns';
import { ReactNode } from 'react';

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

interface IChartBarProps<T> {
	className?: string;
	title: string;
	data: T[];
	dataKeyX: keyof T;
	colors: string[];
}

export default function ChartBarDash<T extends Record<string, ReactNode>>({ title, data, dataKeyX, colors, className }: IChartBarProps<T>) {
	const today = new Date();
	const firstDayOfYear = startOfYear(today);

	const seriesKeys = data.length ? Object.keys(data[0]).filter((k) => k !== dataKeyX) : [];
	const config: Record<string, { label: string; color: string }> = {};
	seriesKeys.forEach((key, i) => {
		config[key] = { label: key, color: colors[i] || '#888' };
	});

	return (
		<Card className={`shadow-none ${className}`}>
			<CardHeader className='gap-0'>
				<div className='flex justify-between'>
					<p className='font-semibold'>{title}</p>
					<div className='flex gap-4'>
						{Object.keys(config).map((key) => (
							<div key={key} className='flex items-center gap-2'>
								<span className='inline-block size-2.5 rounded-full' style={{ backgroundColor: config[key].color }} />
								<p className='text-sm text-[#707070] capitalize'>{config[key].label}</p>
							</div>
						))}
					</div>
				</div>
				<p className='text-sm text-[#707070]'>
					({format(firstDayOfYear, 'dd/MM/yyyy')} - {format(today, 'dd/MM/yyyy')})
				</p>
			</CardHeader>
			<CardContent className='p-2'>
				<ChartContainer config={config} className='-ml-3 max-h-[240px] w-full'>
					<BarChart accessibilityLayer data={data} barCategoryGap={'20%'} barGap={8}>
						<CartesianGrid strokeWidth={1} stroke='var(--chart-grid)' />
						<YAxis
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) =>
								value.toLocaleString('en-US', {
									notation: 'compact',
									maximumFractionDigits: 2,
								})
							}
						/>
						<XAxis
							dataKey={dataKeyX as string}
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							tickCount={2}
							tickFormatter={(value) => String(value).slice(0, 3)}
						/>
						<ChartTooltip cursor={false} content={<CustomTooltip />} />
						{Object.keys(config).map((key) => (
							<Bar key={key} dataKey={key} fill={config[key].color} radius={[4, 4, 0, 0]} maxBarSize={35} />
						))}
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
