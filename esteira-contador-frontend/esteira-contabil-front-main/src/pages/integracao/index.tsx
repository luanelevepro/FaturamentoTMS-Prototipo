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
import { getIntegrationColumns } from '@/components/general/integracao/integracao-columns';
import { getIntegracao, Integration } from '@/services/api/integracao';
import { useCompanyContext } from '@/context/company-context';
import IntegrationModal from '@/components/general/integracao/btn-create-integracao';

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { state: empresa_id } = useCompanyContext();

  const {
    data,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery<Integration[]>({
    queryKey: ['get-integracao-gerencial', empresa_id],
    queryFn: () => getIntegracao(empresa_id, 'gerencial'),
    staleTime: 1000 * 60 * 5,
    enabled: !!empresa_id,
  });

  const filtered = useMemo(() => {
    return data?.filter(
      (i) =>
        i.ds_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.ds_descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  if (isError) {
    toast.error((error as Error).message);
  }

  return (
    <>
      <Head>
        <title>Integrações | Esteira</title>
      </Head>
      <DashboardLayout
        title='Integrações'
        description='Gerencie as integrações do sistema.'
      >
        <div className='grid gap-6'>
          <div className='flex gap-2 items-center'>
            <div className='relative flex-1'>
              <SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Buscar integração...'
                className='pl-8'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant='outline'
              size='icon'
              disabled={isFetching}
              onClick={() => refetch()}
            >
              <RefreshCw
                className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
              />
            </Button>
            <IntegrationModal/>
          </div>

          {filtered?.length === 0 ? (
            <EmptyState label='Nenhuma integração encontrada.' />
          ) : (
            <DataTable
              columns={getIntegrationColumns()}
              data={filtered || []}
            />
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
