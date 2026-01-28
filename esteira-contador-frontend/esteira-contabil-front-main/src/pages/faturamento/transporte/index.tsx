import DashboardLayout from '@/components/layout/dashboard-layout';
import Head from 'next/head';
import CardsTransporte from '@/components/general/transporte/CardsTransporte';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AddPercurso from '@/components/general/transporte/AddPercurso';
import { format } from 'date-fns';
import { badgeTripStatus } from '@/utils/functions';

export interface IFilter {
	search: string;
	take: number;
	page: number;
	total: number;
	totalPage: number;
	length: number;
	startDate?: Date | string;
	endDate?: Date | string;
}

type Status = 'transit' | 'successTwo' | 'late';

export interface ObjTrip {
	id: string;
	idViagem: string;
	time: Date;
	cavalo: string;
	carreta?: string[];
	motorista: string;
	valorTotal: number;
	valorFrete: number;
	status: Status;
}

const mockJoints: ObjTrip[] = [
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
	},
];

export default function TransportePage() {
	/* 	const [filter, setFilter] = useState<IFilter>({
		search: '',
		take: 10,
		page: 1,
		total: 8,
		totalPage: 37,
		length: 10,
	}); */

	console.log('🚀 ~ getStatusInfo ~ Eita:', mockJoints?.[0]?.time);

	return (
		<>
			<Head>
				<title>Viagens e Cargas | Esteira</title>
			</Head>
			<DashboardLayout title='Viagens e Cargas' description='Visão Geral das Viagens e Cargas'>
				<CardsTransporte />
				<h2 className='pt-3 pb-4 text-xl font-semibold'>Últimas viagens</h2>
				<div className='mt-4 grid w-full overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className=''>ID Viagem</TableHead>
								<TableHead className=''>Criação</TableHead>
								<TableHead className='w-1/3'>Cavalo+Carreta</TableHead>
								<TableHead className='w-1/3'>Motorista</TableHead>
								<TableHead className='min-w-[140px]'>Valor total da carga</TableHead>
								<TableHead className='min-w-[100px]'>Frete</TableHead>
								<TableHead className='min-w-[140px]'>Status</TableHead>
								<TableHead className=''>Add Percurso</TableHead>
								<TableHead className='w-4'>Visualizar</TableHead>
								<TableHead className=''>Detalhes</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{mockJoints.map((trip) => (
								<TableRow key={trip.id}>
									<TableCell>{!!trip.id ? trip.id : '--'}</TableCell>
									<TableCell>
										{format(trip.time, 'dd/MM/yyyy')}
										<p>{format(trip.time, 'HH:mm')}</p>
									</TableCell>
									<TableCell>
										{!!trip.cavalo ? trip.cavalo : '--'}
										{trip?.carreta?.map((x, index: number) => {
											return <p key={index}>{x}</p>;
										})}
									</TableCell>
									<TableCell>{!!trip.motorista ? trip.motorista : '--'}</TableCell>

									<TableCell>
										{!!trip.valorTotal
											? trip.valorTotal
													.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
													.replace(/[^\d.,-]/g, '')
													.trim()
											: '--'}
									</TableCell>

									<TableCell>
										{!!trip.valorFrete
											? trip.valorFrete
													.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
													.replace(/[^\d.,-]/g, '')
													.trim()
											: '--'}
									</TableCell>

									<TableCell>
										<Badge variant={trip.status} className='border-transparent p-2'>
											{badgeTripStatus(trip.status)}
										</Badge>
									</TableCell>

									<TableCell className='text-center'>
										<AddPercurso idViagem={trip} />
									</TableCell>
									<TableCell className='text-center'>
										<Button tooltip='Visualizar' variant='ghost' size='icon'>
											<Eye />
										</Button>
									</TableCell>
									<TableCell className='text-center'>
										<Button tooltip='Detalhes' variant='ghost' size='icon'>
											<ChevronDown className='!size-6' />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				{/* {filter.total > 10 && <Pagination filter={filter} setFilter={setFilter} length={length} />} */}
			</DashboardLayout>
		</>
	);
}
