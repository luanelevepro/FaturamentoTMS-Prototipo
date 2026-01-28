import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

export interface INfe {
	id: string;
	nf: string;
	remetente: string;
	destinatario: string;
	valorTotal: number;
	peso: number;
}

const mockCTE: INfe[] = [
	{
		id: '1',
		nf: '156518161981198161516895498456181656161',
		remetente: 'Rementente ABCD',
		destinatario: 'Destinatário ABCD',
		valorTotal: 10000,
		peso: 10000,
	},
	{
		id: '2',
		nf: '156518161981198161516895498456181656161',
		remetente: 'Rementente ABCD',
		destinatario: 'Destinatário ABCD',
		valorTotal: 10000,
		peso: 10000,
	},
	{
		id: '3',
		nf: '156518161981198161516895498456181656161',
		remetente: 'Rementente ABCD',
		destinatario: 'Destinatário ABCD',
		valorTotal: 10000,
		peso: 10000,
	},
];

interface IPropsTable {
	invoice: INfe[];
	setInvoice: React.Dispatch<React.SetStateAction<INfe[]>>;
	query: string;
	setQuery: (value: string) => void;
}

export default function TableNfe({ query, setQuery, invoice, setInvoice }: IPropsTable) {
	const data = mockCTE;

	const toggleInvoice = (cte: INfe, checked: boolean) => {
		if (checked) {
			setInvoice((prev) => [...prev, cte]);
		} else {
			setInvoice((prev) => prev.filter((item) => item.id !== cte.id));
		}
	};

	const toggleAll = (checked: boolean, list: INfe[]) => {
		if (checked) {
			setInvoice(list);
		} else {
			setInvoice([]);
		}
	};

	const filteredCTE = data.filter(
		(cte) =>
			cte.nf.includes(query) ||
			cte.remetente.toLowerCase().includes(query.toLowerCase()) ||
			cte.destinatario.toLowerCase().includes(query.toLowerCase()),
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
									checked={invoice.length === filteredCTE.length}
									onCheckedChange={(checked) => toggleAll(!!checked, filteredCTE)}
									aria-label='Select all'
								/>
							</TableHead>
							<TableHead className='w-1/4'>NFe</TableHead>
							<TableHead className='w-1/4'>Remetente</TableHead>
							<TableHead className='w-1/4'>Destinatário</TableHead>
							<TableHead className='w-1/4'>Valor Total</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredCTE.map((cte) => (
							<TableRow key={cte.id}>
								<TableCell>
									<Checkbox
										checked={invoice.some((item) => item.id === cte.id)}
										onCheckedChange={(checked) => toggleInvoice(cte, !!checked)}
										aria-label='Selecionar NF-e'
									/>
								</TableCell>
								<TableCell>{cte.nf}</TableCell>
								<TableCell>{cte.remetente}</TableCell>
								<TableCell>{cte.destinatario}</TableCell>
								<TableCell>
									{cte.valorTotal.toLocaleString('pt-br', {
										style: 'currency',
										currency: 'BRL',
									})}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
