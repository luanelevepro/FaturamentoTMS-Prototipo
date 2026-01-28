'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function DatePicker({ modal, name }: { modal?: boolean; name?: string }) {
	const [date, setDate] = React.useState<Date>();

	return (
		<>
			<Popover modal={modal}>
				{/* Este input permite obter a data selecionada em formulários utilizando as funções nativas. */}
				<input name={name} type='hidden' value={date ? format(date, 'yyyy-MM-dd') : ''} />
				<PopoverTrigger asChild>
					<Button
						role='none'
						variant={'outline'}
						className={cn('justify-start text-left font-normal', !date && 'text-muted-foreground')}
					>
						<CalendarIcon className='mr-2 h-4 w-4' />
						{date ? (
							format(date, 'PPP', {
								locale: ptBR,
							})
						) : (
							<span>Selecione uma data</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0'>
					<Calendar mode='single' selected={date} onSelect={setDate} locale={ptBR} />
				</PopoverContent>
			</Popover>
		</>
	);
}
