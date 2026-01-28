import DashboardLayout from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';
import { CalendarDays, Eye, SearchIcon } from 'lucide-react';
import Head from 'next/head';
import { useState } from 'react';
import { IFilter } from '..';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import FilterDrawer from '@/pages/faturamento/veiculos/FilterDrawer';
import Pagination from '@/pages/faturamento/serie/Pagination';
import AddMDFeORNFe from '@/components/general/transporte/AddMDFeORNFe';
import AddMDFe from '@/components/general/transporte/Dfe/AddMDFe';

export interface ObjCte {
	id: string;
	time: Date;
	estados: string[];
	placa?: string;
	valorTotal: number;
	peso: number;
	doc: string[];
	status: 'autorizado' | 'encerrado' | 'não';
	averbado: boolean;
}

const mockMDFe: ObjCte[] = [
	{
		id: 'MDFE1360',
		time: new Date('Thu Sep 18 2025 14:22:27'),
		doc: ['Nome do tomador', '1', '2'],
		estados: ['RS', 'SC', 'PR'],
		valorTotal: 40000,
		placa: 'ABC1234',
		peso: 10000,
		status: 'autorizado',
		averbado: true,
	},
	{
		id: 'MDFE3679',
		time: new Date('2025-08-11'),
		doc: ['Nome do tomador', '1'],
		estados: ['RS', 'SC', 'PR', 'MG'],

		valorTotal: 40000,
		placa: 'ABC1234',
		peso: 10000,
		status: 'encerrado',

		averbado: true,
	},
	{
		id: 'MDFE1238',
		time: new Date('2025-08-11'),
		doc: ['Nome do tomador', '1', '2', '3'],
		estados: ['RS', 'SC'],
		valorTotal: 40000,
		placa: 'ABC1234',
		peso: 10000,
		status: 'não',
		averbado: false,
	},
];

export default function TransporteMdfe() {
	const [drawerRegister, setDrawerRegister] = useState<'cte' | 'nfe' | ''>('');
	const [filter, setFilter] = useState<IFilter>({
		search: '',
		take: 10,
		page: 1,
		total: 200,
		totalPage: 37,
		length: 10,
	});

	return (
		<>
			<AddMDFe open={drawerRegister === 'cte'} setOpen={() => setDrawerRegister('')} />
			<Head>
				<title>Transporte CTe | Esteira</title>
			</Head>
			<DashboardLayout title='Viagens e Cargas' description='Visão Geral das Viagens e Cargas'>
				<h2 className='pt-3 pb-4 text-xl font-semibold'>MDFe - Manifesto de Documentos Fiscais Eletrônico</h2>
				<div className='flex gap-2'>
					<div className='relative col-span-5 h-10 flex-1'>
						<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
						<Input
							placeholder='Pesquisar'
							value={filter.search}
							onChange={(e) => setFilter({ ...filter, search: e.target.value })}
							className='mr-2 pl-8'
						/>
					</div>
					<Button tooltip='Filtro por período' variant='outline'>
						<CalendarDays />
						<p>Período</p>
					</Button>
					<FilterDrawer>
						<h1>Form dos filtros</h1>
					</FilterDrawer>
					<AddMDFeORNFe setOpenDrawerCte={() => setDrawerRegister('cte')} setOpenDrawerNFe={() => setDrawerRegister('nfe')} />
				</div>
				<div className='mt-4 grid w-full overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className=''>ID</TableHead>
								<TableHead className=''>Data emissão</TableHead>
								<TableHead className='w-1/3'>Estados do percurso</TableHead>
								<TableHead className='w-28'>Placa</TableHead>
								<TableHead className=''>Valor da carga (R$)</TableHead>
								<TableHead className=''>Peso total (bruto)</TableHead>
								<TableHead className='w-20'>Docs</TableHead>
								<TableHead className=''>Status</TableHead>
								<TableHead className=''>Averbado</TableHead>
								<TableHead className=''>Visualizar</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{mockMDFe.map((mdfe) => (
								<TableRow key={mdfe.id}>
									<TableCell>{!!mdfe.id ? mdfe.id : '--'}</TableCell>
									<TableCell>{format(mdfe.time, 'dd/MM/yyyy')}</TableCell>
									{/* <TableCell>{!!mdfe.tomador ? mdfe.tomador : '--'}</TableCell> */}
									<TableCell>
										{mdfe.estados?.map((state, index: number) => (
											<>
												<Badge key={index} variant={'gray'} className='border-transparent px-2 py-1'>
													{state}
												</Badge>

												{index < mdfe.estados.length - 1 && <span className='px-1'>{'>'}</span>}
											</>
										))}
									</TableCell>
									<TableCell>{mdfe.placa}</TableCell>
									<TableCell>
										{!!mdfe.valorTotal ? mdfe.valorTotal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) : '--'}
									</TableCell>

									<TableCell>{mdfe.peso.toLocaleString('pt-br', { style: 'decimal' })} Kg</TableCell>
									<TableCell>{mdfe.doc?.length} docs</TableCell>
									<TableCell>
										<Badge
											variant={
												mdfe.status === 'autorizado' ? 'successTwo' : mdfe.status === 'encerrado' ? 'transit' : 'statusDanger'
											}
											className='border-transparent px-2 py-1 capitalize'
										>
											{mdfe.status === 'não' ? 'Não autorizado' : mdfe.status}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant={mdfe.averbado ? 'successTwo' : 'gray'} className='border-transparent px-2 py-1'>
											{mdfe.averbado ? 'Sim' : 'Não'}
										</Badge>
									</TableCell>

									<TableCell className='text-center'>
										<Button tooltip='Detalhes' variant='ghost' size='icon'>
											<Eye />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				<Pagination
					isFetting={false}
					page={10}
					pageSize={10}
					totalItems={10}
					totalPages={10}
					hasNextPage={false}
					hasPreviousPage={false}
					setPage={(value: number) => setFilter({ ...filter, page: value })}
					setTake={() => {}}
				/>
			</DashboardLayout>
		</>
	);
}
