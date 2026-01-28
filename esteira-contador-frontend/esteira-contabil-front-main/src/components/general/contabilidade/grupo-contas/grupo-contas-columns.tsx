// columns.ts

import { ColumnDef } from '@tanstack/react-table';
import { GrupoConta } from '@/pages/contabilidade/grupos-contas';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import HandleDelete from './btn-delete-grupo';
import HandleDeactivateGrupo from './btn-deactivate-grupo';
import HandleActivateGrupo from './btn-activate-grupo';
import HandleUpdateGrupo from './btn-update-grupo';

export function getColumns(refetch: () => void): ColumnDef<GrupoConta>[] {
	return [
		{
			accessorKey: 'ds_classificacao_grupo',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Classificação do Grupo' />,
			cell: ({ row }) => row.getValue('ds_classificacao_grupo'),
		},
		{
			accessorKey: 'ds_nome_grupo',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Nome do Grupo' />,
			cell: ({ row }) => row.getValue('ds_nome_grupo'),
		},
		{
			accessorKey: 'ds_tipo',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Tipo do Grupo' />,
			cell: ({ row }) => row.getValue('ds_tipo'),
		},
		{
			accessorKey: 'con_tipo_grupo.ds_nome_tipo',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Indicador de Tipo' />,
			cell: ({ row }) => {
				const { con_tipo_grupo } = row.original;
				return con_tipo_grupo?.ds_nome_tipo ?? 'Sem tipo';
			},
		},
		{
			accessorKey: 'is_ativo',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
			cell: ({ row }) => {
				return (
					<Badge variant={row.getValue('is_ativo') ? 'success' : 'destructive'} className='cursor-default'>
						{row.getValue('is_ativo') ? 'Ativo' : 'Inativo'}
					</Badge>
				);
			},
		},
		{
			id: 'actions',
			cell: ({ row }) => {
				const grupo = row.original;
				const ativo = row.original.is_ativo === true;
				return (
					<div className='flex justify-end gap-2'>
						<HandleUpdateGrupo data={row.original} onChange={() => refetch()}>
							<Button tooltip='Editar' variant='ghost' size='icon'>
								<Pencil />
							</Button>
						</HandleUpdateGrupo>
						<HandleDelete grupo={row.original} />
						<div className='flex justify-end gap-2'>
							{ativo ? <HandleDeactivateGrupo grupo={grupo} /> : <HandleActivateGrupo grupo={grupo} />}
						</div>
					</div>
				);
			},
		},
	];
}
