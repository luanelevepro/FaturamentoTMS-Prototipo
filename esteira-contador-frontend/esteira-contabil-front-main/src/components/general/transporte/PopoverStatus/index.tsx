import { Icons } from '@/components/layout/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check } from 'lucide-react';
import { IStatus } from '@/pages/faturamento/transporte/cte';
import { Badge } from '@/components/ui/badge';

interface IPropStatus {
	obj?: IStatus;
}

const STATUS_CONFIG: Record<keyof IStatus, { label: string; trueText: string; falseText: string }> = {
	fiscal: { label: 'Fiscal', trueText: 'Autorizado', falseText: 'Não autorizado' },
	financeiro: { label: 'Financeiro', trueText: 'Título gerado', falseText: 'Título bloqueado' },
	contabilidade: { label: 'Contabilidade', trueText: 'Contabilizado', falseText: 'Não contabilizado' },
	bloqueio: { label: 'Bloqueio', trueText: 'Liberado', falseText: 'Bloqueado' },
};

export default function PopoverStatus({ obj }: IPropStatus) {
	if (!obj) return null;

	const allTrue = Object.values(obj).every((v) => v === true);

	return (
		<Tooltip>
			<TooltipTrigger aria-label='Status do CTe'>
				<span
					className={`text-primary-foreground mx-auto flex size-5 items-center justify-center rounded-full ${
						allTrue ? 'bg-green' : 'bg-orange'
					}`}
				>
					{allTrue ? <Check className='size-3.5' /> : <Icons.info className='size-3.5' />}
				</span>
			</TooltipTrigger>

			<TooltipContent contrast side='left' className='font-muted-foreground flex min-w-[229px] flex-col gap-1 p-2 font-normal'>
				{Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
					const value = obj[key as keyof IStatus];
					return (
						<div key={key} className='text-muted-foreground flex justify-between gap-4 text-sm font-medium'>
							<p>{cfg.label}</p>
							<Badge variant={value ? 'successTwo' : 'late'} className='border-transparent px-2 py-1 leading-[100%]'>
								{value ? cfg.trueText : cfg.falseText}
							</Badge>
						</div>
					);
				})}
			</TooltipContent>
		</Tooltip>
	);
}
