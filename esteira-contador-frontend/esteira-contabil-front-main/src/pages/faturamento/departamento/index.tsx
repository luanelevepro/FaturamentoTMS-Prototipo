import DashboardLayout from '@/components/layout/dashboard-layout';
import Head from 'next/head';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import EmptyState from '@/components/states/empty-state';
import AddDepartament from './add-department';
import AddSubDepartament from './add-sub-department';
import { DeleteItem, EditItem } from '@/components/general/faturamento';
import Pagination from '../serie/Pagination';

export interface departmentProps {
	id: string;
	category?: string;
	subCategory?: string;
	create: string;
	createName: string;
	edit: string;
	editName: string;
	actived: boolean;
}

const mockDepartments: departmentProps[] = [
	{
		id: '0',
		category: 'ABC tecnologia',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '1',
		subCategory: 'Admistrativo',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '2',
		subCategory: 'Consultoria',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '3',
		subCategory: 'Financeiro',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '4',
		subCategory: 'Software',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '5',
		subCategory: 'QUX',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '6',
		subCategory: 'PowerBI',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '7',
		subCategory: 'GrTrans',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '8',
		category: 'DEF Tecnologia',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
	{
		id: '9',
		category: 'GHI tecnologia',
		create: '07/08/2025 - 10:00',
		createName: 'Fábio Souza',
		edit: '07/08/2025 - 10:00',
		editName: 'Fábio Souza',
		actived: true,
	},
];

export interface IFilter {
	search: string;
	take: number;
	page: number;
	total: number;
	totalPage: number;
	length: number;
}

export default function FaturamentoDepartment() {
	const [filter, setFilter] = useState<IFilter>({
		search: '',
		take: 10,
		page: 1,
		total: 152,
		totalPage: 37,
		length: 10,
	});

	return (
		<>
			<Head>
				<title>Cadastro Departamento | Esteira</title>
			</Head>
			<DashboardLayout
				title='Cadastros de Departamentos e Subdepardamentos'
				description='Na seção de cadastro você poderá definir parâmetros e personalização.'
			>
				<div className='grid'>
					<div className='mb-6 flex justify-between'>
						<h1 className='text-xl font-semibold'>Departamentos (centro de custos)</h1>
						<AddDepartament />
					</div>
					{mockDepartments.length === 0 ? (
						<EmptyState label='Não foi encontrado nenhuma série.' />
					) : (
						<div className='w-full overflow-hidden rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow className=''>
										<TableHead>Subdep.</TableHead>
										<TableHead className='w-full'>Departamento/Subdepartamento</TableHead>
										<TableHead className='max-w-[200px] min-w-[200px]'>Inclusão</TableHead>
										<TableHead className='max-w-[200px] min-w-[200px]'>Última alteração</TableHead>
										<TableHead>Inativar</TableHead>
										<TableHead></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{mockDepartments.map((department) => (
										<TableRow key={department.id}>
											<TableCell className='text-center'>
												<AddSubDepartament departments={mockDepartments} />
											</TableCell>
											<TableCell className='font-medium'>
												{department.category}
												<div className='ml-6'>{department.subCategory}</div>
											</TableCell>
											<TableCell>
												{department.create}
												<p>{department.createName}</p>
											</TableCell>
											<TableCell>
												{department.edit}
												<p>{department.editName}</p>
											</TableCell>
											<TableCell>
												<div className='mt-1.5 text-center'>
													<Switch
														checked={department.actived}
														//onCheckedChange={(checked) => handleHabilityChange(employer.id, checked)}
													/>
												</div>
											</TableCell>
											<TableCell className='my-auto flex h-full items-center justify-center p-4'>
												<DeleteItem
													title={`o departamento ${department.subCategory || department.category}`}
													fnc={() => {
														console.log('TCL: Delete - Department -> ', department.id);
													}}
													isLoading={false}
												/>
												<EditItem
													title={`a série ${department.subCategory || department.category}`}
													fnc={() => {
														console.log('TCL: Editar item -> ', department.id);
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
