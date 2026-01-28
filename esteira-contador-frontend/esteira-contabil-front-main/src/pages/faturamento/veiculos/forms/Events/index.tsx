import { Button } from '@/components/ui/button';
import { SelectWithLabel } from '../../../../../components/general/faturamento/SelectWithLabel';
import { SquarePlus } from 'lucide-react';
import { InputDate } from '@/components/general/faturamento/InputDate';
import { InputWithLabel } from '@/components/general/faturamento/InputWithLabel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteItem } from '@/components/general/faturamento';

const mockEvents = [{ id: 0, event: 'Descrição do evento', vencimento: '01/06/2025', realizado: '', observacao: '' }];

const FormEvents: React.FC = () => {
	return (
		<>
			<div className='flex items-end gap-4'>
				<SelectWithLabel
					id='Evento'
					label='Evento'
					placeholder='Selecione'
					options={[
						{ text: 'Evento 1', value: 'Evento 1' },
						{ text: 'Evento 2', value: 'Evento 2' },
					]}
				/>
				<InputDate className='min-w-[150px]' id='inital' label='Vencimento' placeholder='--/--/----' />
				<InputDate className='min-w-[150px]' id='final' label='Data de vencimento' placeholder='--/--/----' />
				<InputWithLabel className='w-full' id='observacao' label='Observação' placeholder='Digite...' />

				<Button tooltip='Filtros' variant='outline'>
					<SquarePlus />
					Adicionar
				</Button>
			</div>
			<div className='w-full overflow-hidden rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='w-1/2'>Evento</TableHead>
							<TableHead className='min-w-28'>Vencimento</TableHead>
							<TableHead className='min-w-28'>Realizado</TableHead>
							<TableHead className='w-1/2'>Observação</TableHead>
							<TableHead className='w-4'></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{mockEvents.map((event) => (
							<TableRow key={event.id}>
								<TableCell className='w-auto font-medium'>{event.event}</TableCell>
								<TableCell>{event.vencimento}</TableCell>
								<TableCell>{!!event.realizado ? event.realizado : '--/--/----'}</TableCell>
								<TableCell className='w-auto'>{!!event.observacao ? event.observacao : '---'}</TableCell>
								<TableCell>
									<DeleteItem 
										title={`o histórico ${event.id}`}
										fnc={() => {
											console.log('TCL: Delete item -> ', event.event);
										}}
										isLoading={false}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
};
export default FormEvents;
