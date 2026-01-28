import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from '@/components/general/fiscal/entradas/regras-nfe/regras-nfe-columns';
import { useQuery } from '@tanstack/react-query';
import { useCompanyContext } from '@/context/company-context';
import { getRegrasNfe } from '@/services/api/regras-nfe';
import { Button } from '@/components/ui/button';
import { RefreshCw, SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/states/empty-state';
import { toast } from 'sonner';
import { BtnAddRegra } from '@/components/general/fiscal/entradas/regras-nfe/btn-add-regra';

export interface RegimeTributario {
	id: string;
	ds_descricao: string;
	ds_crt?: string;
}

export interface Segmentos {
	id: string;
	ds_descricao: string;
}

export interface CfopItem {
	id: string;
	ds_descricao: string;
	ds_codigo: string;
}

export interface CstItem {
	id: string;
	ds_descricao: string;
	ds_codigo: string;
}

export interface OrigemCstItem {
	id: string;
	ds_descricao: string;
	ds_codigo: string;
}

export interface TipoProdutoItem {
	id: string;
	ds_descricao: string;
	ds_codigo: string;
}

export interface OrigemTrib {
	id: string;
	id_fis_regras_entrada_nfe: string;
	id_sis_origem_cst: string;
	sis_origem_cst: OrigemCstItem;
}

export interface TipoProduto {
	id: string;
	id_fis_regras_entrada_nfe: string;
	id_sis_tipos_produto: string;
	sis_tipos_produto: TipoProdutoItem;
}

export interface CfopOrigem {
	id: string;
	id_fis_regras_entrada_nfe: string;
	id_cfop: string;
	sis_cfop: CfopItem;
}

export interface CstOrigem {
	id: string;
	id_fis_regras_entrada_nfe: string;
	id_sis_cst: string;
	sis_cst: CstItem;
}

export interface FisEmpresas {
	id: string;
	id_sis_empresas: string;
}

export interface RegraNfe {
	id: string;
	dt_created: string;
	dt_updated: string;
	ds_descricao: string;
	ds_origem_uf: string;
	ds_destino_uf: string;
	dt_vigencia: string;
	js_ncm_produto: number[];
	id_segmento_destinatario: string;
	id_regime_destinatario: string;
	id_regime_emitente: string;
	id_cfop_entrada: string;
	id_cst_entrada: string;
	id_cfop_gerado?: string;
	id_cst_gerado?: string;
	id_escritorio: string;
	fis_empresas?: FisEmpresas;
	fis_segmentos: Segmentos;
	sis_regime_tributario: RegimeTributario;
	sis_regime_tributario_emit: RegimeTributario;
	sis_cfop_entrada: CfopItem;
	sis_cst_entrada: CstItem;
	sis_cfop_gerado?: CfopItem;
	sis_cst_gerado?: CstItem;
	js_origem_trib: OrigemTrib[];
	js_tipos_produto: TipoProduto[];
	js_cfop_origem: CfopOrigem[];
	js_cst_origem: CstOrigem[];
}

export default function RegrasNfePage() {
	const { state } = useCompanyContext();
	// const [sorting, setSorting] = useState<SortingState>([]);
	const [searchTerm, setSearchTerm] = useState<string>('');
	const { data, refetch, isFetching, isError, error } = useQuery({
		queryKey: ['regras-nfe', state],
		queryFn: () => getRegrasNfe(),
		enabled: !!state,
	});

	const filteredRegras = useMemo(() => {
		interface FilteredRegras {
			ds_descricao: string | null;
			ds_origem_uf: string;
			ds_destino_uf: string;
		}

		return data?.filter(
			(regras: FilteredRegras) =>
				regras.ds_descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				regras.ds_origem_uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
				regras.ds_destino_uf.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [data, searchTerm]);

	if (isError) {
		toast.error(error.message);
	}
	const columns = getColumns(state, { onDuplicated: () => refetch(), onDeleted: () => refetch() });
	return (
		<>
			<Head>
				<title>Regras NFe - Fiscal</title>
			</Head>
			<DashboardLayout title='Regras NFe' description='Gerenciamento de regras para NF-e de entrada.'>
				<div className='grid gap-6'>
					<div className='flex gap-2'>
						<div className='relative col-span-5 h-10 flex-1'>
							<SearchIcon className='absolute top-[45%] left-2 h-4 w-4 -translate-y-1/2 transform' />
							<Input
								placeholder='Pesquisar regras...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='mr-2 pl-8'
							/>
						</div>
						<BtnAddRegra />
						<Button variant='outline' size={'icon'} disabled={isFetching} onClick={() => refetch()}>
							<RefreshCw className={`h-4 w-4 ${isFetching && 'animate-spin'}`} />
						</Button>
					</div>
					{filteredRegras?.length === 0 ? (
						<EmptyState label='Não foi encontrado nenhuma regra.' />
					) : (
						<DataTable columns={columns} data={filteredRegras || ''} />
					)}
				</div>
			</DashboardLayout>
		</>
	);
}
