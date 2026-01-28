import React, { useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Plus, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table-expandable';
import { toast } from 'sonner';
import EmptyState from '@/components/states/empty-state';
import { useCompanyContext } from '@/context/company-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getColumns } from '@/components/general/contabilidade/tipo-grupo/tipo-grupo-columns';
import HandleInsertTipo from '@/components/general/contabilidade/tipo-grupo/btn-insert-tipo';
import { DataTableRef } from '@/components/ui/data-table';
import { getTipoGrupoByEmpresaID } from '@/services/api/tipo-grupo';

export interface TipoGrupo {
	id: string;
	ds_nome_tipo: string;
	is_ativo: boolean;
	js_con_grupo_contas: {
		ds_nome_grupo: string;
	}[];
}

export default function TipoGrupoPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const tableRef = useRef<DataTableRef<TipoGrupo>>(null);
	const [filterTerm, setFilterTerm] = useState<string | null>('Ativos');
	const { state } = useCompanyContext();
	const {
		data: tipoGrupo,
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery<TipoGrupo[]>({
		queryKey: ['get-tipo-grupo', state],
		queryFn: () => getTipoGrupoByEmpresaID(),
		staleTime: 1000 * 60 * 5,
		enabled: !!state,
	});
	const columns = getColumns(refetch);

	const filteredTipoGrupo = useMemo(() => {
		let filtered = tipoGrupo || [];
		if (filterTerm) {
			switch (filterTerm) {
				case 'Ativos':
					filtered = filtered.filter((tipoGrupos: TipoGrupo) => tipoGrupos.is_ativo);
					break;
				case 'Inativos':
					filtered = filtered.filter((tipoGrupos: TipoGrupo) => !tipoGrupos.is_ativo);
					break;

				default:
					break;
			}
		}
		return filtered.filter((tipoGrupos: TipoGrupo) => tipoGrupos.ds_nome_tipo.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [tipoGrupo, searchTerm, filterTerm]);

	if (isError) {
		toast.error((error as Error).message);
	}

	return (
		<>
			<Head>
				<title>Tipo Grupos | Esteira</title>
			</Head>
			<DashboardLayout title='Tipo de Grupos' description='Cadastro de Tipos de Grupo de Contas.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='mr-2 pl-8'
							/>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button tooltip='Filtros' variant='outline'>
									{filterTerm ? filterTerm : 'Status'}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='w-48'>
								<DropdownMenuItem onSelect={() => setFilterTerm('Ativos')}>Ativos</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setFilterTerm('Inativos')}>Inativos</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setFilterTerm(null)}>Limpar Filtros</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button tooltip='Atualizar' variant='outline' size='icon' disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleInsertTipo onChange={() => refetch()}>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar Tipo</p>
							</Button>
						</HandleInsertTipo>
					</div>
					{filteredTipoGrupo?.length === 0 ? (
						<EmptyState label='Nenhum produto encontrado.' />
					) : (
						<DataTable ref={tableRef} columns={columns} data={filteredTipoGrupo || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
