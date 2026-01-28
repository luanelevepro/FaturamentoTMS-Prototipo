import { Button } from '@/components/ui/button';
import { InputWithLabel } from '../../../../../components/general/faturamento/InputWithLabel';
import { SelectWithLabel } from '../../../../../components/general/faturamento/SelectWithLabel';
import { SquarePlus } from 'lucide-react';
import { InputDate } from '@/components/general/faturamento/InputDate';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteItem } from '@/components/general/faturamento';

const mockProperries = [
	{
		id: 0,
		property: 'Descrição',
		docProperty: '999.888.777-66',
		locatario: 'Samuel Fagundes',
		docLocatario: '123.456.789-12',
		inicio: '01/06/2025',
	},
];

const FormProperty: React.FC = () => {
	return (
		<>
			<div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
				<SelectWithLabel
					id='nomeProprietario'
					label='Nome do proprietário'
					placeholder='Selecione uma opção'
					options={[
						{ text: 'Proprietário 1', value: 'Proprietário 1' },
						{ text: 'Proprietário 2', value: 'Proprietário 2' },
					]}
					required
				/>

				<InputWithLabel id='docProprietario' label='CPF/CNPJ - Proprietário' placeholder='Digite...' />
				<SelectWithLabel
					id='locatario'
					label='Locatário'
					placeholder='Selecione uma opção'
					options={[
						{ text: 'Locatário 1', value: 'Locatário 1' },
						{ text: 'Locatário 2', value: 'Locatário 2' },
					]}
					required
				/>
				<InputWithLabel id='docLocatario' label='CPF/CNPJ - Locatário' placeholder='Digite...' />
				<div className='flex items-end gap-4'>
					<InputDate id='inital' label='Início' placeholder='--/--/----' className='w-full' />

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
							<TableHead className='w-1/2'>Proprietário</TableHead>
							<TableHead className='min-w-44'>CPF/CNPJ - Proprietário</TableHead>
							<TableHead className='w-1/2'>Locatário</TableHead>
							<TableHead className='min-w-44'>CPF/CNPJ - Locatário</TableHead>
							<TableHead className='min-w-20'>Início</TableHead>
							<TableHead className='w-4'></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{mockProperries.map((property) => (
							<TableRow key={property.id}>
								<TableCell className='w-auto font-medium'>{property.property}</TableCell>
								<TableCell>{property.docProperty}</TableCell>
								<TableCell>{property.locatario}</TableCell>
								<TableCell>{property.docProperty}</TableCell>
								<TableCell className='w-auto'>{!!property.inicio ? property.inicio : '---'}</TableCell>
								<TableCell>
									<DeleteItem
										title={`o histórico ${property.id}`}
										fnc={() => {
											console.log('TCL: Delete item -> ', property.property);
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
export default FormProperty;
