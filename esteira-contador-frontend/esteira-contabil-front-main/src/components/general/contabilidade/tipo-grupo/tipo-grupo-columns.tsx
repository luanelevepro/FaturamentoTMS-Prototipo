import { ColumnDef } from '@tanstack/react-table';
import { TipoGrupo } from '@/pages/contabilidade/tipos-grupos';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import HandleDelete from './btn-delete-tipo';
import HandleActivateTipo from './btn-activate-tipo';
import HandleDeactivateTipo from './btn-deactivate-tipo';
import HandleUpdateTipo from './btn-update-tipo';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export function getColumns(refetch: () => void): ColumnDef<TipoGrupo>[] {
	return [
		{
			accessorKey: 'ds_nome_tipo',
			header: ({ column }) => <DataTableColumnHeader column={column} title='Nome do Tipo' />,
			cell: ({ row }) => row.getValue('ds_nome_tipo'),
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
				const ativo = row.original.is_ativo === true;
				const tipo = row.original;
				return (
					<div className='flex justify-end gap-2'>
						<HandleUpdateTipo data={row.original} onChange={() => refetch()}>
							<Button tooltip='Editar' variant='ghost' size='icon'>
								<Pencil />
							</Button>
						</HandleUpdateTipo>
						<HandleDelete tipo={row.original} />
						{ativo ? <HandleDeactivateTipo tipo={tipo} /> : <HandleActivateTipo tipo={tipo} />}
					</div>
				);
			},
		},
	];
}
