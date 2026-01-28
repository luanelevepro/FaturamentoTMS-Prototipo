import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const mockHistoric = [{ id: 0, data: '01/06/2025', idUser: 'USER', nome: 'José Campos', tara: '', peso: '' }];

const FormHistoric: React.FC = () => {
	return (
		<>
			<div className='w-full overflow-hidden rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='min-w-20'>Data de registro</TableHead>
							<TableHead className='w-1/4'>ID usuário</TableHead>
							<TableHead className='w-1/4'>Nome</TableHead>
							<TableHead className='w-1/4'>Tara</TableHead>
							<TableHead className='w-1/4'>Peso</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{mockHistoric.map((history) => (
							<TableRow key={history.id}>
								<TableCell>{!!history.data ? history.data : '--/--/----'}</TableCell>
								<TableCell>{!!history.idUser ? history.idUser : '--'}</TableCell>
								<TableCell>{!!history.nome ? history.nome : '--'}</TableCell>
								<TableCell>{!!history.tara ? history.tara : '--'}</TableCell>
								<TableCell>{!!history.peso ? history.peso : '--'}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
};
export default FormHistoric;
