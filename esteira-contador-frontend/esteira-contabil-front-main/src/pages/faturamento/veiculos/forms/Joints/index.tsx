import { Button } from '@/components/ui/button';
import { SelectWithLabel } from '../../../../../components/general/faturamento/SelectWithLabel';
import { SquarePlus } from 'lucide-react';
import { InputDate } from '@/components/general/faturamento/InputDate';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteItem } from '@/components/general/faturamento';

const mockJoints = [
	{
		id: 0,
		cavalo: 'QWERTY',
		carreta: 'ABC4D56',
		carreta1: '',
		carreta2: '',
		carreta3: '',
		carreta4: '',
		motorista: 'Rodrigo santos',
		inicio: '01/06/2025',
		fim: '',
	},
];

const FormJoints: React.FC = () => {
	return (
		<>
			<div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
				<SelectWithLabel
					id='cavalo'
					label='Cavalo'
					placeholder='Selecione'
					options={[
						{ text: 'Cavalo 1', value: 'Cavalo 1' },
						{ text: 'Cavalo 2', value: 'Cavalo 2' },
					]}
				/>
				<SelectWithLabel
					id='Carreta'
					label='Carreta'
					placeholder='Selecione'
					options={[
						{ text: 'Carreta 1', value: 'Carreta 1' },
						{ text: 'Carreta 2', value: 'Carreta 2' },
					]}
				/>
				<SelectWithLabel
					id='Carreta-2'
					label='Carreta 2'
					placeholder='Selecione'
					options={[
						{ text: 'Carreta 1', value: 'Carreta 1' },
						{ text: 'Carreta 2', value: 'Carreta 2' },
					]}
				/>
				<SelectWithLabel
					id='Carreta-3'
					label='Carreta 3'
					placeholder='Selecione'
					options={[
						{ text: 'Carreta 1', value: 'Carreta 1' },
						{ text: 'Carreta 2', value: 'Carreta 2' },
					]}
				/>
				<SelectWithLabel
					id='Carreta-4'
					label='Carreta 4'
					placeholder='Selecione'
					options={[
						{ text: 'Carreta 1', value: 'Carreta 1' },
						{ text: 'Carreta 2', value: 'Carreta 2' },
					]}
				/>
			</div>
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
				<SelectWithLabel
					id='Motorista'
					label='Motorista'
					placeholder='Selecione'
					options={[
						{ text: 'Motorista 1', value: 'Motorista 1' },
						{ text: 'Motorista 2', value: 'Motorista 2' },
					]}
				/>
				<SelectWithLabel
					id='Operação'
					label='Operação'
					placeholder='Selecione'
					options={[
						{ text: 'Operação 1', value: 'Operação 1' },
						{ text: 'Operação 2', value: 'Operação 2' },
					]}
				/>
				<div className='flex items-end gap-4'>
					<InputDate id='inital' label='Início' placeholder='--/--/----' className='w-full' />
					<InputDate id='final' label='Final' placeholder='--/--/----' className='w-full' />

					<Button tooltip='Filtros' variant='outline'>
						<SquarePlus />
						Adicionar
					</Button>
				</div>
			</div>
			<div className='w-full overflow-hidden rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='min-w-[120px]'>Cavalo</TableHead>
							<TableHead className='min-w-[120px]'>Carreta</TableHead>
							<TableHead className='min-w-[120px]'>Carreta 2</TableHead>
							<TableHead className='min-w-[120px]'>Carreta 3</TableHead>
							<TableHead className='min-w-[120px]'>Carreta 4</TableHead>
							<TableHead className='w-1/2'>Motorista</TableHead>
							<TableHead className='min-w-[80px]'>Inicío</TableHead>
							<TableHead className='min-w-[80px]'>Fim</TableHead>
							<TableHead className='w-4'></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{mockJoints.map((joints) => (
							<TableRow key={joints.id}>
								<TableCell>{!!joints.cavalo ? joints.cavalo : '--'}</TableCell>
								<TableCell>{!!joints.carreta1 ? joints.carreta1 : '--'}</TableCell>
								<TableCell>{!!joints.carreta2 ? joints.carreta2 : '--'}</TableCell>
								<TableCell>{!!joints.carreta3 ? joints.carreta3 : '--'}</TableCell>
								<TableCell>{!!joints.carreta4 ? joints.carreta4 : '--'}</TableCell>
								<TableCell>{!!joints.motorista ? joints.motorista : '--'}</TableCell>
								<TableCell>{!!joints.inicio ? joints.inicio : '--/--/----'}</TableCell>
								<TableCell>{!!joints.fim ? joints.fim : '--/--/----'}</TableCell>
								<TableCell>
									<DeleteItem
										title={`o histórico ${joints.id}`}
										fnc={() => {
											console.log('TCL: Delete item -> ', joints.id);
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
export default FormJoints;
