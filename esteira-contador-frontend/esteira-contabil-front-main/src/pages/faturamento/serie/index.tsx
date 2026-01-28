import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ListFilter, SearchIcon } from 'lucide-react';
import Head from 'next/head';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import EmptyState from '@/components/states/empty-state';
import { DeleteItem, EditItem } from '@/components/general/faturamento';
import Pagination from './Pagination';

export interface serieProps {
	id: string;
	type: string;
	serie: string;
	lastGeneration: string;
	actived: boolean;
}

const mockSeries: serieProps[] = [
	{ id: '0', type: 'NF-e', serie: '1', lastGeneration: '000.001', actived: true },
	{ id: '4', type: 'NFs-e', serie: 'U', lastGeneration: '000.002', actived: true },
	{ id: '1', type: 'NF-e', serie: '2', lastGeneration: '000.001', actived: false },
	{ id: '2', type: 'CT-e', serie: '1', lastGeneration: '000.001', actived: true },
	{ id: '3', type: 'NFs-e', serie: 'U', lastGeneration: '000.001', actived: true },
];

export interface IFilter {
	search: string;
	take: number;
	page: number;
	total: number;
	totalPage: number;
	length: number;
}

export default function FaturamentoSerie() {
	const [filter, setFilter] = useState<IFilter>({
		search: '',
		take: 10,
		page: 1,
		total: 300,
		totalPage: 37,
		length: 10,
	});

	return (
		<>
			<Head>
				<title>Cadastro Série | Esteira</title>
			</Head>
			<DashboardLayout title='Cadastros de Séries' description='Na seção de cadastro você poderá definir parâmetros e personalização.'>
				<div className='grid'>
					<div className='mb-6'>
						<h1 className='mb-6 text-xl font-semibold'>Séries</h1>
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
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button tooltip='Filtros' variant='outline'>
										<ListFilter />
										<p>Filtros</p>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className='w-48'>
									<DropdownMenuItem>Ativos</DropdownMenuItem>
									<DropdownMenuItem>Inativos</DropdownMenuItem>
									<DropdownMenuItem>Limpar Filtros</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
					{mockSeries.length === 0 ? (
						<EmptyState label='Não foi encontrado nenhuma série.' />
					) : (
						<div className='w-full overflow-hidden rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow className=''>
										<TableHead className='w-1/3'>Tipo de Documento</TableHead>
										<TableHead className='w-1/3'>Série</TableHead>
										<TableHead className='w-1/3'>Última Numeração</TableHead>
										<TableHead>Inativar</TableHead>
										<TableHead></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{mockSeries.map((serie) => (
										<TableRow key={serie.id}>
											<TableCell className='font-medium'>{serie.type}</TableCell>
											<TableCell>{serie.serie}</TableCell>
											<TableCell>{serie.lastGeneration}</TableCell>
											<TableCell className='bg-reda-500'>
												<div className='mt-1.5 text-center'>
													<Switch
														checked={serie.actived}
														//onCheckedChange={(checked) => handleHabilityChange(employer.id, checked)}
													/>
												</div>
											</TableCell>
											<TableCell className='flex items-center px-4'>
												<DeleteItem
													title={`a série ${serie.serie}`}
													fnc={() => {
														console.log('TCL: Delete item -> ', serie.serie);
													}}
													isLoading={false}
												/>
												<EditItem
													title={`a série ${serie.serie}`}
													fnc={() => {
														console.log('TCL: Editar item -> ', serie.serie);
													}}
													isLoading={false}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
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
				</div>
			</DashboardLayout>
		</>
	);
}
