import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartDataPoint {
	name: string;
	value: number;
	color: string;
	[key: string]: unknown;
}

interface AuditoriaChartProps {
	data: ChartDataPoint[];
	centerLabel: string | number;
	centerSubLabel: string;
	className?: string;
}

export function AuditoriaChart({ data, centerLabel, centerSubLabel, className = '' }: AuditoriaChartProps) {
	const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

	return (
		<div className={`flex flex-col items-center gap-6 sm:flex-row ${className}`}>
			<div className='relative h-[160px] w-[160px] flex-shrink-0'>
				<ResponsiveContainer width='100%' height='100%'>
					<PieChart>
						<Pie
							data={data}
							cx='50%'
							cy='50%'
							innerRadius={55}
							outerRadius={75}
							paddingAngle={4}
							dataKey='value'
							stroke='none'
							startAngle={90}
							endAngle={-270}
						>
							{data.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={entry.color} />
							))}
						</Pie>
						<Tooltip
							formatter={(value: number) => [value, 'Qtd']}
							contentStyle={{
								borderRadius: '8px',
								border: '1px solid hsl(var(--border))',
								backgroundColor: 'hsl(var(--background))',
								color: 'hsl(var(--foreground))',
							}}
							itemStyle={{ color: 'hsl(var(--foreground))' }}
						/>
					</PieChart>
				</ResponsiveContainer>
				{/* Center Text Overlay */}
				<div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
					<span className='text-foreground text-3xl font-bold'>{centerLabel}</span>
					<span className='text-muted-foreground text-[10px] tracking-wider uppercase'>{centerSubLabel}</span>
				</div>
			</div>

			<div className='w-full min-w-[180px] space-y-3'>
				{data.map((item) => (
					<div key={item.name} className='flex items-center justify-between gap-4'>
						<div className='flex items-center gap-2'>
							<div
								className='h-2.5 w-2.5 rounded-full shadow-[0_0_8px]'
								style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
							></div>
							<span className='text-foreground max-w-[120px] truncate text-sm font-medium' title={item.name}>
								{item.name}
							</span>
						</div>
						<div className='flex items-center gap-2'>
							<span className='text-sm font-bold' style={{ color: item.color }}>
								{item.value}
							</span>
							<span className='text-muted-foreground w-10 text-right text-xs'>
								{totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) + '%' : '0%'}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
