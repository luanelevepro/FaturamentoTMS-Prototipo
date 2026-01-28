import { Tag, TagProps } from '@/components/ui/tags';
import { Card } from '@/components/ui/card';
import { InfoIcon, InfoIconProps } from '@/components/ui/info-icon';
import { formatBRL } from '@/utils/format-brazilian-currency';
import { ReactNode } from 'react';

const valueMock = 1322000;

interface summaryProps {
	subTitle: string;
	tagType: TagProps['type'];
	color: InfoIconProps['color'];
	text: ReactNode[];
	typeIcon: InfoIconProps['icon'];
	dataTag?: string;
}

const listSummary: summaryProps[] = [
	{
		subTitle: 'Performace vs Ano anterior',
		tagType: 'text',
		color: 'green',
		typeIcon: 'up',
		dataTag: '+16.7%',
		text: [<p key='meta'>Faturamento superior comparado ao mesmo período do ano de 2024.</p>],
	},
	{
		subTitle: 'Atingimento da Meta',
		tagType: 'text',
		color: 'orange',
		typeIcon: 'info',
		dataTag: '68.3%',
		text: [
			<p key='meta'>
				Meta mensal <strong className='text-orange-opacity'>atingida parcialmente.</strong>
			</p>,
		],
	},
	{
		subTitle: 'Último mês',
		tagType: 'text',
		color: 'red',
		typeIcon: 'down',
		dataTag: '83.6% da meta',
		text: [<p key='meta'>Julho: ${formatBRL(valueMock)}</p>],
	},
	{
		subTitle: 'Recomendações',
		tagType: 'icon',
		color: 'blue',
		typeIcon: 'info',
		text: [
			<p key='1'>Implementar ações que possam acelerar a vendas para atingir a meta mensal.</p>,
			<p key='2'>Implementar ações que possam acelerar a vendas para atingir a meta mensal.</p>,
			<p key='3'>Implementar ações que possam acelerar a vendas para atingir a meta mensal.</p>,
			<p key='4'>Implementar ações que possam acelerar a vendas para atingir a meta mensal.</p>,
			<p key='5'>Implementar ações que possam acelerar a vendas para atingir a meta mensal.</p>,
		],
	},
];

export default function Summary() {
	return (
		<div className='order-7 row-span-3 lg:col-span-2 xl:order-8 xl:col-span-1'>
			<Card className='row-span-3 h-fit gap-0 p-6 shadow-none'>
				<h5 className='font-semibold'>Resumo executivo</h5>
				<div className='mt-6 flex flex-col gap-4'>
					{listSummary.map((summary, index) => {
						return (
							<div key={index}>
								<h6 className='mb-2 text-sm font-medium'>{summary.subTitle}</h6>
								<div className='flex gap-2'>
									<Tag variant={summary.color} type={summary.tagType}>
										<InfoIcon icon={summary.typeIcon} color={summary.color} />
										{summary.dataTag}
									</Tag>
									<div className='text-muted-foreground mt-1 flex flex-col gap-3'>
										{summary.text.map((textSummary) => {
											return textSummary;
										})}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</Card>
		</div>
	);
}
