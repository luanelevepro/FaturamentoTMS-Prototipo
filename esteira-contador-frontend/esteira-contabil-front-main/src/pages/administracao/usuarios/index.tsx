import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Plus, RefreshCw, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/general/administrativo/usuarios/usuarios-columns';
import EmptyState from '@/components/states/empty-state';
import { getUsuariosEmpresa } from '@/services/api/empresas';
import { useCompanyContext } from '@/context/company-context';
import HandleInsertUser from '@/components/general/administrativo/usuarios/btn-insert-user';

export interface User {
	id: string;
	ds_name: string | null;
	ds_email: string;
	is_confirmed: boolean;
}

export default function UsuariosPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const { state: empresa_id } = useCompanyContext();

	const {
		data: users,
		isError,
		error,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ['get-usuarios-empresa', empresa_id],
		queryFn: async () => {
			return await getUsuariosEmpresa(empresa_id);
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!empresa_id,
	});

	const filteredUsers = useMemo(() => {
		interface FilteredUsers {
			ds_name: string | null;
			ds_email: string;
		}

		return users?.filter(
			(user: FilteredUsers) =>
				user.ds_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.ds_email.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [users, searchTerm]);

	if (isError) {
		toast.error(error.message);
	}

	return (
		<>
			<Head>
				<title>Usuários | Esteira</title>
			</Head>
			<DashboardLayout title='Usuários' description='Gerencie os acessos dos usuários.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar usuários...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o estado do termo de busca
								className='mr-2 pl-8'
							/>
						</div>
						<Button tooltip='Atualizar' variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
						<HandleInsertUser empresa_id={empresa_id} onUserChange={() => refetch()}>
							<Button variant={'outline'} className='h-9 max-sm:w-9'>
								<Plus className='h-4 w-4 sm:hidden' />
								<p className='max-sm:hidden'>Adicionar Usuário</p>
							</Button>
						</HandleInsertUser>
					</div>
					{filteredUsers?.length === 0 ? (
						<EmptyState label='Não foi encontrado nenhum usuário.' />
					) : (
						<DataTable columns={columns} data={filteredUsers || ''} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
