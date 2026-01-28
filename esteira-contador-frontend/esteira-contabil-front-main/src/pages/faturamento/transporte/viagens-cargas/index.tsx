import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FilterDrawer from '@/pages/faturamento/veiculos/FilterDrawer';
import { CalendarDays, ChevronDown, Eye, SearchIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Head from 'next/head';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { IFilter } from '..';
import AddTravel from '@/components/general/transporte/AddTravel';
import AddPercurso from '@/components/general/transporte/AddPercurso';
import { badgeTripStatus } from '@/utils/functions';
import AccordionDetails from './AccordionDetails';

type Status = 'transit' | 'successTwo' | 'late';

interface IOrigem {
	cidade: string;
	endereco: string;
	ct: string;
}

interface IDestino {
	id: string;
	cidade: string;
	end: string;
	destino: string;
	docs?: { id: string; doc: string }[];
	status: Status;
}
interface costDetails {
	combustivel: number;
	pedagio: number;
	outrasDepesas: number;
	custosPessoal: number;
	custosTotal: number;
	margemLucro: number;
	faturamento: number;
}
export interface ObjTravel {
	id: string;
	origem: IOrigem;
	destino: IDestino[];
}

export interface ObjCte {
	costDetails: costDetails;
	id: string;
	idViagem: string;
	time: Date;
	cavalo: string;
	carreta?: string[];
	motorista: string;
	valorTotal: number;
	valorFrete: number;
	status: Status;
	detalhes: ObjTravel[];
}

const mockTravel: ObjTravel[] = [
	{
		id: '1',
		origem: {
			cidade: 'Porto Alegre/RS',
			endereco: 'Rua Salvador, 124 - Santa Maria Goretti',
			ct: 'POA123',
		},
		destino: [
			{
				id: '1',
				cidade: 'Blumenau/SC',
				end: 'Av. Bahia, 999 - Salvo Wesbach',
				destino: 'Nome do destinatário',
				docs: [{ id: '1', doc: 'CT0123' }],
				status: 'successTwo',
			},
			{
				id: '2',
				cidade: 'Blumenau/SC',
				end: 'Av. Bahia, 999 - Salvo Wesbach',
				destino: 'Nome do destinatário',
				docs: [{ id: '1', doc: 'NF0997' }],
				status: 'successTwo',
			},
			{
				id: '3',
				cidade: 'Blumenau/SC',
				end: 'Av. Bahia, 999 - Salvo Wesbach',
				destino: 'Nome do destinatário',
				docs: [{ id: '1', doc: 'NF0123' }],
				status: 'successTwo',
			},
		],
	},
	{
		id: '2',
		origem: {
			cidade: 'Cacavel/PR',
			endereco: 'Rua 14 de novembro, 124 - KM 456',
			ct: 'CAS 123',
		},
		destino: [
			{
				id: '1',
				cidade: 'Florianopólis/SC',
				end: 'Av. Bahia, 999 - Salvo Wesbach',
				destino: 'Nome do destinatário',
				docs: [
					{ id: '1', doc: 'NF0123' },
					{ id: '2', doc: 'NF0123' },
				],
				status: 'transit',
			},
			{
				id: '2',
				cidade: 'Porto Alegre/RS',
				end: 'Av. Bahia, 999 - Salvo Wesbach',
				destino: 'Nome do destinatário',
				docs: [
					{ id: '1', doc: 'NF0123' },
					{ id: '2', doc: 'NF0123' },
				],
				status: 'late',
			},
		],
	},
];

const mockTravelAndCargo: ObjCte[] = [
	{
		id: '123456',
		idViagem: 'VG1234',
		time: new Date('Thu Sep 18 2025 14:22:27'),
		cavalo: 'ABC1V234',
		carreta: ['ABC1V235', 'ABD9E999'],
		motorista: 'Nome do motorista',
		valorTotal: 40000,
		valorFrete: 2600,
		status: 'transit',
		detalhes: mockTravel,
		costDetails: {
			combustivel: 600,
			pedagio: 150,
			outrasDepesas: 180,
			custosPessoal: 300,
			custosTotal: 1200,
			margemLucro: 90,
			faturamento: 38800,
		},
	},
	{
		id: '1234567',
		idViagem: 'VG1234',
		time: new Date('2025-08-11'),
		cavalo: 'ABC1V234',
		carreta: [],
		motorista: 'Nome do motorista',
		valorTotal: 40000,
		valorFrete: 2600,
		status: 'successTwo',
		detalhes: mockTravel,
		costDetails: {
			combustivel: 600,
			pedagio: 150,
			outrasDepesas: 180,
			custosPessoal: 300,
			custosTotal: 1200,
			margemLucro: 90,
			faturamento: 38800,
		},
	},
	{
		id: '12367',
		idViagem: 'VG1234',
		time: new Date('2025-08-11'),
		cavalo: 'ABC1V234',
		carreta: ['ABC1V235'],
		motorista: 'Nome do motorista',
		valorTotal: 40000,
		valorFrete: 2600,
		status: 'late',
		detalhes: mockTravel,
		costDetails: {
			combustivel: 600,
			pedagio: 150,
			outrasDepesas: 180,
			custosPessoal: 300,
			custosTotal: 1200,
			margemLucro: 90,
			faturamento: 38800,
		},
	},
];

export default function TransporteViagensCargas() {
	const [expandedRow, setExpandedRow] = useState<string | null>(null);
	const [filter, setFilter] = useState<IFilter>({
		search: '',
		take: 10,
		page: 1,
		total: 200,
		totalPage: 37,
		length: 10,
	});

	const toggleRow = (id: string) => {
		setExpandedRow(expandedRow === id ? null : id);
	};

	return (
		<>
			<Head>
				<title>Viagens e Cargas | Esteira</title>
			</Head>
			<DashboardLayout title='Viagens e Cargas' description='Registros de Viagens e Cargas'>
				<h2 className='pt-3 pb-4 text-xl font-semibold'>Viagens e cargas</h2>
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
					<AddTravel />
				</div>
				<div className='mt-4 grid w-full overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-16'>ID Viagem</TableHead>
								<TableHead className='w-20'>Criação</TableHead>
								<TableHead className='w-28'>Cavalo + Carreta</TableHead>
								<TableHead className=''>Motorista</TableHead>
								<TableHead className=''>Valor total carga</TableHead>
								<TableHead className=''>Frete</TableHead>
								<TableHead className='w-4'>Status</TableHead>
								<TableHead className='w-4'>Add Percurso</TableHead>
								<TableHead className='w-4'>Visualizar</TableHead>
								<TableHead className='w-4'>Detalhes</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{mockTravelAndCargo.map((travel, index) => (
								<React.Fragment key={travel.id}>
									<TableRow key={index}>
										<TableCell>{travel.id || '--'}</TableCell>
										<TableCell>
											{format(travel.time, 'dd/MM/yyyy')}
											<p>{format(travel.time, 'hh:mm')}</p>
										</TableCell>
										<TableCell>
											{!!travel.cavalo ? travel.cavalo : '--'}
											{travel?.carreta?.map((x, index) => {
												return <p key={index}>{x}</p>;
											})}
										</TableCell>
										<TableCell>{!!travel.motorista ? travel.motorista : '--'}</TableCell>
										<TableCell>
											{travel.valorTotal
												? travel.valorTotal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
												: '--'}
										</TableCell>
										<TableCell>
											{travel.valorFrete
												? travel.valorFrete.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
												: '--'}
										</TableCell>
										<TableCell className='text-center'>
											<Badge variant={travel.status} className='border-transparent p-2'>
												{badgeTripStatus(travel.status)}
											</Badge>
										</TableCell>
										<TableCell className='text-center'>
											<AddPercurso idViagem={travel} />
										</TableCell>
										<TableCell className='text-center'>
											<Button tooltip='Detalhes' variant='ghost' size='icon'>
												<Eye />
											</Button>
										</TableCell>
										<TableCell className='text-center'>
											<Button variant='ghost' size='icon' onClick={() => toggleRow(travel.id)}>
												<ChevronDown
													className={`size-6! transition-transform duration-300 ${expandedRow === travel.id ? 'rotate-180' : ''}`}
												/>
											</Button>
										</TableCell>
									</TableRow>

									{expandedRow === travel.id && <AccordionDetails key={`details-${travel.id}`} travel={travel} />}
								</React.Fragment>
							))}
						</TableBody>
					</Table>
				</div>
			</DashboardLayout>
		</>
	);
}
