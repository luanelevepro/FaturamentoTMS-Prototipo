import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteItem, EditItem } from '../../../components/general/faturamento';
import FilterDrawer from '../veiculos/FilterDrawer';
import RegisterApolice from './RegisterApolice';
import Pagination from '../serie/Pagination';

export interface IFilter {
	search: string;
	take: number;
	page: number;
	total: number;
	totalPage: number;
	length: number;
}

const mockJoints = [
	{
		id: '#0200',
		apolice: 'Apólice de acidente',
		seguradora: 'Abc Seguros',
		numeroApolice: 'Número de Apólice',
	},
];

export default function FaturamentoEmpresa() {
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
			<Head>
				<title>Cadastro Apólices | Esteira</title>
			</Head>
			<DashboardLayout title='Cadastro Apólices' description='Na seção de cadastro você poderá definir parâmetros e personalização.'>
				<div className='mb-6 grid'>
					<h1 className='mb-6 text-xl font-semibold'>Apólices de Seguro</h1>
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
						<FilterDrawer filter={filter} setFilter={setFilter}>
							<h1>Form dos filtros</h1>
						</FilterDrawer>
						<RegisterApolice />
					</div>
					<div className='mt-4 w-full overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className=''>ID</TableHead>
									<TableHead className='w-1/3'>Nome da apólice</TableHead>
									<TableHead className='w-1/3'>Seguradora</TableHead>
									<TableHead className='w-1/3'>Número da Apólice</TableHead>
									<TableHead className=''>Excluir</TableHead>
									<TableHead className=''>Editar</TableHead>
									<TableHead className='w-4'>Visualizar</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{mockJoints.map((joints) => (
									<TableRow key={joints.id}>
										<TableCell>{!!joints.id ? joints.id : '--'}</TableCell>
										<TableCell>{!!joints.apolice ? joints.apolice : '--'}</TableCell>
										<TableCell>{!!joints.seguradora ? joints.seguradora : '--'}</TableCell>
										<TableCell>{!!joints.numeroApolice ? joints.numeroApolice : '--'}</TableCell>
										<TableCell>
											<DeleteItem
												title={`o veículo ${joints.id}`}
												fnc={() => {
													console.log('TCL: Editar item -> ', joints.id);
												}}
												isLoading={false}
											/>
										</TableCell>
										<TableCell>
											<EditItem
												title={`o veículo ${joints.id}`}
												fnc={() => {
													console.log('TCL: Editar item -> ', joints.id);
												}}
												isLoading={false}
											/>
										</TableCell>
										<TableCell className='text-center'>
											<Button tooltip='Visualizar' variant='ghost' size='icon'>
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
				</div>
			</DashboardLayout>
		</>
	);
}
