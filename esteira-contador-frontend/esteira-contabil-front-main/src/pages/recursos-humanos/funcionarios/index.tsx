import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { getFuncionarioColumns } from '@/components/general/recursos-humanos/funcionarios/funcionario-columns';
import { toast } from 'sonner';
import EmptyState from '@/components/states/empty-state';
import { getFuncionarioEmpresa } from '@/services/api/funcionarios';
import { useCompanyContext } from '@/context/company-context';
import HandleUpdateFuncionario from '@/components/general/recursos-humanos/funcionarios/btn-update-all';

export interface Funcionario {
	id: string;
	created_at: string;
	id_externo: string;
	id_empresa_externo: string;
	ds_nome_empresa_externo: string;
	ds_nome: string;
	ds_documento: string;
	dt_admissao: string;
	ds_categoria: string;
	ds_salario: string;
	cd_situacao: string;
	ds_situacao: string;
	ds_sexo: string;
	ds_horas_dia: string;
	ds_horas_semana: string;
	ds_horas_mes: string;
	ds_jornada_descricao: string;
	cd_cargo_dominio: number;
	ds_data_nascimento: string;
	id_cargo_nivel: string;
	ds_venc_ferias: string;
	id_empresa: string;
	id_centro_custos: string | null;
	id_departamento: string | null;
	id_cargo: string;
	rh_cargo_nivel_senioridade?: {
		id: string;
		ds_aumento: string;
		id_cargo: string;
		id_nivel: string;
		id_senioridade: string;
		// rh_cargo?: {
		// 	id: string;
		// 	ds_nome: string;
		// };
		rh_nivel?: {
			id: string;
			ds_nome: string;
		};
		rh_senioridade?: {
			id: string;
			ds_nome: string;
		};
	};
	rh_centro_custos?: {
		ds_nome: string;
	};
	rh_departamento?: {
		ds_nome: string;
	};
	rh_cargos?: {
		ds_nome: string;
	};
}

export default function FuncionariosPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const { state: empresa_id } = useCompanyContext();

	const {
		data: funcionarios,
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ['get-funcionarios-empresa', empresa_id],
		queryFn: async () => {
			return await getFuncionarioEmpresa(empresa_id);
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!empresa_id,
	});

	const filteredFuncionarios = useMemo(() => {
		interface FilteredFuncionarios {
			ds_nome: string | null;
			ds_salario: string;
		}

		return funcionarios?.filter(
			(funcionario: FilteredFuncionarios) =>
				funcionario.ds_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				funcionario.ds_salario.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [funcionarios, searchTerm]);

	if (isError) {
		toast.error(error.message);
	}

	return (
		<>
			<Head>
				<title>Funcionários | Esteira</title>
			</Head>
			<DashboardLayout title='Funcionários' description='Gerencie os funcionários.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar funcionários...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='mr-2 pl-8'
							/>
						</div>
						<Button variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleUpdateFuncionario />
					</div>
					{filteredFuncionarios?.length === 0 ? (
						isFetching ? (
							<EmptyState label='Carregando...' />
						) : (
							<EmptyState label='Não foi encontrado nenhum funcionário.' />
						)
					) : (
						<DataTable columns={getFuncionarioColumns()} data={filteredFuncionarios || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
