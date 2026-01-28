import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useCompanyContext } from '@/context/company-context';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllModules, getModule, postEmployeeEnterprise } from '@/services/api/transporte';
import { AccessPayload, EmployeProps, IEmpresasModule } from '@/interfaces';
import { IAllModules } from '@/interfaces/faturamento/modulos/newModule';

const INITIAL_ITEMS: EmployeProps[] = [
	{ id: '0', text: 'Habilitar Integração Fiscal', hability: false },
	{ id: '1', text: 'Habilitar Integração Financeira', hability: false },
	{ id: '2', text: 'Habilitar Integração Contábil', hability: false },
	{ id: '3', text: 'Controle de Viagens', hability: false },
];
export default function FaturamentoEmpresa() {
	const queryClient = useQueryClient();
	const { state: empresa_id } = useCompanyContext();
	const { data: dataModule } = useQuery<IEmpresasModule>({
		queryKey: ['fat-module'],
		queryFn: () => getModule(empresa_id),
		staleTime: 1000 * 60 * 60,
	});

	const { data: dataAllModules } = useQuery<IAllModules[]>({
		queryKey: ['all-modules'],
		queryFn: getAllModules,
		staleTime: 1000 * 60 * 1,
	});

	const filteredModules = dataAllModules?.filter((module) => module.ds_module === 'FATURAMENTO')[0];

	const [employers, setEmployers] = useState<EmployeProps[]>(INITIAL_ITEMS);
	const [initialEmployers, setInitialEmployers] = useState<EmployeProps[]>(INITIAL_ITEMS);
	const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (dataModule) {
			const updated = INITIAL_ITEMS.map((item) =>
				item.id === '0'
					? {
							...item,
							date: dataModule.dt_ativacao ? new Date(dataModule.dt_ativacao) : undefined,
							hability: dataModule.is_activated || false,
						}
					: item,
			);
			setEmployers(updated);
			setInitialEmployers(updated);
		}
	}, [dataModule]);

	const hasChanges = JSON.stringify(employers) !== JSON.stringify(initialEmployers);

	const handleDateChange = (id: string, newDate: Date | undefined) => {
		setEmployers((prev) => prev.map((emp) => (emp.id === id ? { ...emp, date: newDate } : emp)));
		setOpenPopovers((prev) => ({ ...prev, [id]: false }));
	};

	const handleHabilityChange = (id: string, checked: boolean) => {
		setEmployers((prev) => prev.map((emp) => (emp.id === id ? { ...emp, hability: checked } : emp)));
	};

	const handleClearDate = (id: string) => {
		setEmployers((prev) => prev.map((emp) => (emp.id === id ? { ...emp, date: undefined } : emp)));
		setOpenPopovers((prev) => ({ ...prev, [id]: false }));
	};

	const handleSubmit = async () => {
		const [fiscal, financeira, contabil, viagens] = employers;
		console.log(financeira, contabil, viagens);

		try {
			setLoading(true);
			const payload: AccessPayload = {
				id_empresa: empresa_id,
				id_module: filteredModules?.id || '',
				dt_ativacao: format(new Date(fiscal?.date || ''), 'dd/MM/yyyy') || '',
				is_activated: fiscal.hability,
			};

			await postEmployeeEnterprise(payload);
			queryClient.invalidateQueries({ queryKey: ['fat-module'] });
			setInitialEmployers(employers);
			toast.success('Alterações salvas com sucesso');
		} catch (error) {
			console.error('Erro ao salvar:', error);
			toast.error('Erro ao salvar alterações');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Head>
				<title>Cadastro Empresa | Esteira</title>
			</Head>
			<DashboardLayout
				title='Cadastro Empresa'
				description='Na seção de cadastro você poderá definir parâmetros e personalização.'
				rightSection={
					<Button onClick={handleSubmit} disabled={loading || !hasChanges}>
						{loading ? 'Salvando...' : 'Salvar Alterações'}
					</Button>
				}
			>
				<div>
					<h1 className='mb-6 text-xl font-semibold'>Empresa</h1>
					<div className='flex flex-col gap-12 sm:gap-5'>
						{employers.map((item) => (
							<div key={item.id} className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
								<h1 className='text-nowrap'>{item.text}</h1>
								<div className='ml-auto flex items-center gap-4'>
									{item.id !== '3' && (
										<>
											<h1 className='text-nowrap'>A partir de</h1>
											<Popover
												open={openPopovers[item.id] || false}
												onOpenChange={(open) => setOpenPopovers((prev) => ({ ...prev, [item.id]: open }))}
											>
												<PopoverTrigger asChild>
													<Button className='!bg-ring w-32 justify-normal border-none lg:w-[213px]' variant='outline'>
														<CalendarIcon className='mr-2 h-4 w-4' />
														{item.date ? format(item.date, 'dd/MM/yyyy') : <span>--/----</span>}
													</Button>
												</PopoverTrigger>
												<PopoverContent className='w-auto p-0'>
													<Calendar
														mode='single'
														autoFocus
														locale={ptBR}
														selected={item.date}
														onSelect={(date) => handleDateChange(item.id, date)}
														footer={
															<Button variant='ghost' size='sm' className='w-full' onClick={() => handleClearDate(item.id)}>
																Limpar
															</Button>
														}
													/>
												</PopoverContent>
											</Popover>
										</>
									)}
									<Switch
										checked={item.hability}
										disabled={loading}
										onCheckedChange={(checked) => handleHabilityChange(item.id, checked)}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</DashboardLayout>
		</>
	);
}

