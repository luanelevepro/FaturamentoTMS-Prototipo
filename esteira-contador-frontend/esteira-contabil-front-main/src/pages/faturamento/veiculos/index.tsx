import DashboardLayout from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';
import { Eye, SearchIcon } from 'lucide-react';
import Head from 'next/head';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditItem } from '@/components/general/faturamento';
import FilterDrawer from './FilterDrawer';
import RegisterVehicle from './RegisterVehicle';
import Pagination from '../serie/Pagination';

const mockJoints = [
	{
		id: '#0001',
		placa: 'ABC1D23',
		tipodeveiculo: '2 - Carreta',
		modalMarca: '1234 - ABC Indústria e Comércio de Importação',
		cidade: 'Rodrigo santosPeritiba/SC',
	},
];

export interface IFilterVehicles {
	search: string;
	take: number;
	page: number;
	total: number;
	totalPage: number;
	length: number;
}

interface IFilterComplet extends IFilterVehicles {
	fieldOne: string;
	fieldTwo: string;
	fieldThree: string;
}

export default function FaturamentoVeiculo() {
	const [filter, setFilter] = useState<IFilterVehicles>({
		search: '',
		take: 10,
		page: 1,
		total: 52,
		totalPage: 37,
		length: 10,
	});
	const [auxFilter, setAuxFIlter] = useState<IFilterComplet>({
		...filter,
		fieldOne: '',
		fieldTwo: '',
		fieldThree: '',
	});
	console.log('🚀 ~ FaturamentoVeiculo ~ auxFilter:', auxFilter, setAuxFIlter);

	return (
		<>
			<Head>
				<title>Cadastro Veículos | Esteira</title>
			</Head>
			<DashboardLayout title='Cadastro Veículos' description='Na seção de cadastro você poderá definir parâmetros e personalização.'>
				<div className='mb-6 grid'>
					<h1 className='mb-6 text-xl font-semibold'>Veículos</h1>
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
						<RegisterVehicle />
					</div>
					<div className='mt-4 w-full overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className=''>ID</TableHead>
									<TableHead className=''>Placa</TableHead>
									<TableHead className='min-w-[80px]'>Tipo de veículo</TableHead>
									<TableHead className='w-1/2'>Modelo/Marca</TableHead>
									<TableHead className='w-1/3'>Cidade</TableHead>
									<TableHead className=''>Editar</TableHead>
									<TableHead className='w-4'>Visualizar</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{mockJoints.map((joints) => (
									<TableRow key={joints.id}>
										<TableCell>{!!joints.id ? joints.id : '--'}</TableCell>
										<TableCell>{!!joints.placa ? joints.placa : '--'}</TableCell>
										<TableCell>{!!joints.tipodeveiculo ? joints.tipodeveiculo : '--'}</TableCell>
										<TableCell>{!!joints.modalMarca ? joints.modalMarca : '--'}</TableCell>
										<TableCell>{!!joints.placa ? joints.placa : '--'}</TableCell>
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
