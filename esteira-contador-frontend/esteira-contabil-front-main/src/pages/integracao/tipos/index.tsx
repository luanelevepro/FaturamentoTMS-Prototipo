// src/pages/integrations/types/index.tsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import EmptyState from '@/components/states/empty-state';
import { getIntegrationTypeColumns } from '@/components/general/integracao/tipo-integracao-columns';
import { getTipoIntegracao } from '@/services/api/tipo-integracao';

export interface IntegrationType {
	id: string;
	ds_nome: string;
	dt_created: string;
	dt_updated: string;
}

export default function IntegrationTypesPage() {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const { data, isError, error, isFetching, refetch } = useQuery<IntegrationType[]>({
		queryKey: ['get-integracao-tipos'],
		queryFn: getTipoIntegracao,
		staleTime: 1000 * 60 * 5,
	});

	const filtered = useMemo(() => {
		return data?.filter((t) => t.ds_nome.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [data, searchTerm]);

	if (isError) toast.error((error as Error).message);

	return (
		<>
			<Head>
				<title>Tipos de Integração | Esteira</title>
			</Head>
			<DashboardLayout title='Tipos de Integração' description='Gerencie os tipos disponíveis.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2' />
							<Input
								placeholder='Buscar tipo...'
								className='pl-8'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
						<Button variant='outline' size='icon' disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
						</Button>
					</div>
					{filtered?.length === 0 ? (
						<EmptyState label='Nenhum tipo encontrado.' />
					) : (
						<DataTable columns={getIntegrationTypeColumns()} data={filtered || []} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
