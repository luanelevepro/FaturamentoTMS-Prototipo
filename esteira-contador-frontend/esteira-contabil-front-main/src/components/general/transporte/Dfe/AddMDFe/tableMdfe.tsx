import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export interface IMdfe {
	id: string;
	date: Date;
	remetente: string;
	destinatario: string;
	origem: string;
	destino: string;
	valorTotal: number;
	status: boolean;
	statusSeguro: boolean;
}

const mockMdfe: IMdfe[] = [
	{
		id: 'CT0999',
		date: new Date('10-11-2025'),
		remetente: 'Rementente ABCD',
		destinatario: 'Destinatário ABCD',
		destino: 'Cidade B',
		origem: 'Cidade A',
		valorTotal: 10000,
		status: true,
		statusSeguro: true,
	},
	{
		id: 'CT0998',
		date: new Date('10-11-2025'),
		remetente: 'Rementente ABCD',
		destinatario: 'Destinatário ABCD',
		destino: 'Cidade B',
		origem: 'Cidade A',
		valorTotal: 10000,
		status: false,
		statusSeguro: true,
	},
	{
		id: 'CT0997',
		date: new Date('10-11-2025'),
		remetente: 'Rementente ABCD',
		destinatario: 'Destinatário ABCD',
		destino: 'Cidade B',
		origem: 'Cidade A',
		valorTotal: 10000,
		status: false,
		statusSeguro: false,
	},
	{
		id: 'CT0996',
		date: new Date('10-11-2025'),
		remetente: 'Rementente ABCD',
		destinatario: 'Destinatário ABCD',
		destino: 'Cidade B',
		origem: 'Cidade A',
		valorTotal: 10000,
		status: true,
		statusSeguro: false,
	},
];

interface IPropsTable {
	invoice: IMdfe[];
	setInvoice: React.Dispatch<React.SetStateAction<IMdfe[]>>;
	query: string;
	setQuery: (value: string) => void;
}

export default function TableNfe({ query, setQuery, invoice, setInvoice }: IPropsTable) {
	const data = mockMdfe;

	const toggleInvoice = (mdfe: IMdfe, checked: boolean) => {
		if (checked) {
			setInvoice((prev) => [...prev, mdfe]);
		} else {
			setInvoice((prev) => prev.filter((item) => item.id !== mdfe.id));
		}
	};

	const toggleAll = (checked: boolean, list: IMdfe[]) => {
		if (checked) {
			setInvoice(list);
		} else {
			setInvoice([]);
		}
	};

	const filteredMdfe = data.filter(
		(mdfe) =>
			mdfe.id.includes(query) ||
			mdfe.remetente.toLowerCase().includes(query.toLowerCase()) ||
			mdfe.destinatario.toLowerCase().includes(query.toLowerCase()),
	);

	return (
		<>
			<div className='relative col-span-5 h-10 flex-1'>
				<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
				<Input placeholder='Pesquisar' value={query} onChange={(e) => setQuery(e.target.value)} className='mr-2 pl-8' />
			</div>

			<div className='mt-4 w-full overflow-hidden rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='w-8'>
								<Checkbox
									checked={invoice.length === filteredMdfe.length}
									onCheckedChange={(checked) => toggleAll(!!checked, filteredMdfe)}
									aria-label='Select all'
								/>
							</TableHead>
							<TableHead className='min-w-20'>ID CTe</TableHead>
							<TableHead className='w-1/4'>Date emissão</TableHead>
							<TableHead className='w-1/4'>Rementente</TableHead>
							<TableHead className='w-1/4'>Destinatário</TableHead>
							<TableHead className='w-1/4'>{'Origem > Detino'}</TableHead>
							<TableHead className='min-w-40'>Valor </TableHead>
							<TableHead className='min-w-36'>Status</TableHead>
							<TableHead className='min-w-36'>Seguro de carga</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredMdfe.map((mdfe) => (
							<TableRow key={mdfe.id}>
								<TableCell>
									<Checkbox
										checked={invoice.some((item) => item.id === mdfe.id)}
										onCheckedChange={(checked) => toggleInvoice(mdfe, !!checked)}
										aria-label='Selecionar NF-e'
									/>
								</TableCell>
								<TableCell>{mdfe.id}</TableCell>
								<TableCell>{format(mdfe.date, 'dd/MM/yyyy')}</TableCell>
								<TableCell>{mdfe.remetente}</TableCell>
								<TableCell>{mdfe.destinatario}</TableCell>
								<TableCell>{`${mdfe.origem} > ${mdfe.destino}`}</TableCell>
								<TableCell>
									{mdfe.valorTotal.toLocaleString('pt-br', {
										style: 'currency',
										currency: 'BRL',
									})}
								</TableCell>

								<TableCell>
									<Badge variant={mdfe.status ? 'successTwo' : 'gray'} className='border-transparent px-2 py-1'>
										{mdfe.status ? 'Autorizado' : 'Bloqueado'}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge variant={mdfe.statusSeguro ? 'successTwo' : 'gray'} className='border-transparent px-2 py-1'>
										{mdfe.statusSeguro ? 'Averbado' : 'Não Averbado'}
									</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
